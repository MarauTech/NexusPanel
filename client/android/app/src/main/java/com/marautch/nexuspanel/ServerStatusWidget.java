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

public class ServerStatusWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_server_status);

        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent rootPendingIntent = PendingIntent.getActivity(
                context, 200 + appWidgetId, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_srv_root, rootPendingIntent);

        String cached = WidgetUpdateHelper.getCachedJson(context, "server_status");
        if (cached != null && !cached.isEmpty()) {
            try {
                applyServerStatus(views, new JSONObject(cached));
            } catch (Exception ignored) {}
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);

        Executors.newSingleThreadExecutor().execute(() -> {
            String serverUrl = WidgetUpdateHelper.getServerUrl(context);
            try {
                URL url = new URL(serverUrl + "/api/widgets/server-status");
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
                    WidgetUpdateHelper.setCachedJson(context, "server_status", raw);
                    JSONObject json = new JSONObject(raw);

                    new Handler(Looper.getMainLooper()).post(() -> {
                        applyServerStatus(views, json);
                        appWidgetManager.updateAppWidget(appWidgetId, views);
                    });
                }
                conn.disconnect();
            } catch (Exception ignored) {}
        });
    }

    private static void applyServerStatus(RemoteViews views, JSONObject json) {
        final String cpu = json.optInt("cpu", 0) + "%";
        final String ram = json.optInt("ram", 0) + "%";
        final String temp = json.has("temperature") && !json.isNull("temperature") 
                ? json.optString("temperature", "N/A") : "N/A";
        final String uptime = json.optString("uptimeFormatted", "0m");
        final String status = json.optString("status", "online");

        views.setTextViewText(R.id.widget_srv_cpu, cpu);
        views.setTextViewText(R.id.widget_srv_ram, ram);
        views.setTextViewText(R.id.widget_srv_temp, temp);
        views.setTextViewText(R.id.widget_srv_uptime, uptime);

        if ("offline".equalsIgnoreCase(status)) {
            views.setTextViewText(R.id.widget_srv_status_badge, "🔴 Offline");
            views.setImageViewResource(R.id.widget_srv_dot, R.drawable.widget_status_offline);
        } else if ("warning".equalsIgnoreCase(status)) {
            views.setTextViewText(R.id.widget_srv_status_badge, "🟡 Warning");
            views.setImageViewResource(R.id.widget_srv_dot, R.drawable.widget_status_warning);
        } else {
            views.setTextViewText(R.id.widget_srv_status_badge, "🟢 Online");
            views.setImageViewResource(R.id.widget_srv_dot, R.drawable.widget_status_online);
        }
    }
}
