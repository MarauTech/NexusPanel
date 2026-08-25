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

public class UptimeWidget extends AppWidgetProvider {

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
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_uptime);

        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent rootPendingIntent = PendingIntent.getActivity(
                context, 400 + appWidgetId, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_uptime_root, rootPendingIntent);

        String cached = WidgetUpdateHelper.getCachedJson(context, "uptime_stats");
        if (cached != null && !cached.isEmpty()) {
            try {
                applyUptimeStats(views, new JSONObject(cached));
            } catch (Exception ignored) {}
        } else {
            views.setTextViewText(R.id.widget_uptime_big_percent, "--%");
            views.setTextViewText(R.id.widget_uptime_host_text, "Host: --");
            views.setTextViewText(R.id.widget_uptime_24h, "--%");
            views.setTextViewText(R.id.widget_uptime_7d, "--%");
            views.setTextViewText(R.id.widget_uptime_30d, "--%");
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);

        Executors.newSingleThreadExecutor().execute(() -> {
            String serverUrl = WidgetUpdateHelper.getServerUrl(context);
            try {
                URL url = new URL(serverUrl + "/api/widgets/uptime-stats");
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
                    WidgetUpdateHelper.setCachedJson(context, "uptime_stats", raw);
                    JSONObject json = new JSONObject(raw);

                    new Handler(Looper.getMainLooper()).post(() -> {
                        applyUptimeStats(views, json);
                        appWidgetManager.updateAppWidget(appWidgetId, views);
                    });
                }
                conn.disconnect();
            } catch (Exception ignored) {}
        });
    }

    private static void applyUptimeStats(RemoteViews views, JSONObject json) {
        final double u30d = json.optDouble("uptime30d", 0.0);
        final double u24h = json.optDouble("uptime24h", 0.0);
        final double u7d = json.optDouble("uptime7d", 0.0);
        final String hostUptime = json.optString("uptimeFormatted", "--");

        views.setTextViewText(R.id.widget_uptime_big_percent, String.format("%.2f%%", u30d));
        views.setTextViewText(R.id.widget_uptime_host_text, "Host: " + hostUptime);
        views.setTextViewText(R.id.widget_uptime_24h, String.format("%.2f%%", u24h));
        views.setTextViewText(R.id.widget_uptime_7d, String.format("%.2f%%", u7d));
        views.setTextViewText(R.id.widget_uptime_30d, String.format("%.2f%%", u30d));
    }
}
