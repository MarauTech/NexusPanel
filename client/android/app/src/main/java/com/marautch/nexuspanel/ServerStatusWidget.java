package com.marautch.nexuspanel;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
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
                context, 200, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_srv_root, rootPendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);

        Executors.newSingleThreadExecutor().execute(() -> {
            String serverUrl = "http://192.168.10.96:3000";
            try {
                SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
                String saved = prefs.getString("nexuspanel_server_url", null);
                if (saved != null && !saved.isEmpty()) {
                    serverUrl = saved;
                }
            } catch (Exception ignored) {}

            try {
                URL url = new URL(serverUrl + "/api/widgets/server-status");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(3500);
                conn.setReadTimeout(3500);
                if (conn.getResponseCode() == 200) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) sb.append(line);
                    reader.close();

                    JSONObject json = new JSONObject(sb.toString());
                    final String cpu = json.optInt("cpu", 18) + "%";
                    final String ram = json.optInt("ram", 42) + "%";
                    final String temp = json.has("temperature") && !json.isNull("temperature") 
                            ? json.getString("temperature") : "48°C";
                    final String uptime = json.optString("uptimeFormatted", "42d 6h");
                    final String status = json.optString("status", "online");

                    new Handler(Looper.getMainLooper()).post(() -> {
                        views.setTextViewText(R.id.widget_srv_cpu, cpu);
                        views.setTextViewText(R.id.widget_srv_ram, ram);
                        views.setTextViewText(R.id.widget_srv_temp, temp);
                        views.setTextViewText(R.id.widget_srv_uptime, uptime);

                        if ("offline".equalsIgnoreCase(status)) {
                            views.setTextViewText(R.id.widget_srv_status_badge, "🔴 Offline");
                            views.setImageViewResource(R.id.widget_srv_dot, R.drawable.widget_status_offline);
                        } else if ("warning".equalsIgnoreCase(status)) {
                            views.setTextViewText(R.id.widget_srv_status_badge, "🟡 Warning");
                            views.setImageViewResource(R.id.widget_srv_dot, R.drawable.widget_status_online);
                        } else {
                            views.setTextViewText(R.id.widget_srv_status_badge, "🟢 Online");
                            views.setImageViewResource(R.id.widget_srv_dot, R.drawable.widget_status_online);
                        }
                        appWidgetManager.updateAppWidget(appWidgetId, views);
                    });
                }
                conn.disconnect();
            } catch (Exception ignored) {}
        });
    }
}
