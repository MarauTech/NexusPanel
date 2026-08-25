package com.marautch.nexuspanel;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.Executors;

public class ServicesStatusWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onDeleted(Context context, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            WidgetUpdateHelper.removeWidgetConfig(context, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_services_status);

        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent rootPendingIntent = PendingIntent.getActivity(
                context, 300 + appWidgetId, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_services_root, rootPendingIntent);

        String cached = WidgetUpdateHelper.getCachedJson(context, "services_summary");
        if (cached != null && !cached.isEmpty()) {
            try {
                applyServicesSummary(views, new JSONObject(cached));
            } catch (Exception ignored) {}
        } else {
            views.setTextViewText(R.id.widget_services_total_badge, "-- Usług");
            views.setTextViewText(R.id.widget_services_online_count, "--");
            views.setTextViewText(R.id.widget_services_warning_count, "--");
            views.setTextViewText(R.id.widget_services_offline_count, "--");
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);

        Executors.newSingleThreadExecutor().execute(() -> {
            String serverUrl = WidgetUpdateHelper.getServerUrl(context);
            try {
                URL url = new URL(serverUrl + "/api/widgets/services-summary");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(4000);
                conn.setReadTimeout(4000);
                if (conn.getResponseCode() == 200) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) sb.append(line);
                    reader.close();

                    String raw = sb.toString();
                    WidgetUpdateHelper.setCachedJson(context, "services_summary", raw);
                    JSONObject json = new JSONObject(raw);

                    new Handler(Looper.getMainLooper()).post(() -> {
                        applyServicesSummary(views, json);
                        appWidgetManager.updateAppWidget(appWidgetId, views);
                    });
                }
                conn.disconnect();
            } catch (Exception ignored) {}
        });
    }

    private static void applyServicesSummary(RemoteViews views, JSONObject json) {
        final int total = json.optInt("total", 0);
        final int online = json.optInt("online", 0);
        final int warning = json.optInt("warning", 0);
        final int offline = json.optInt("offline", 0);

        views.setTextViewText(R.id.widget_services_total_badge, total + " Usług");
        views.setTextViewText(R.id.widget_services_online_count, String.valueOf(online));
        views.setTextViewText(R.id.widget_services_warning_count, String.valueOf(warning));
        views.setTextViewText(R.id.widget_services_offline_count, String.valueOf(offline));
    }
}
