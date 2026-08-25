package com.marautch.nexuspanel;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.Executors;

public class SingleServiceWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_single_service);

        // Default open NexusPanel app
        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent rootPendingIntent = PendingIntent.getActivity(
                context, 500, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_single_root, rootPendingIntent);

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
                URL url = new URL(serverUrl + "/api/widgets/service-monitor");
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
                    final String name = json.optString("name", "Plex Media Server");
                    final String ip = json.optString("ip", "192.168.10.20");
                    final String svcUrl = json.optString("url", "");
                    final String status = json.optString("status", "online");
                    final String uptime = json.optString("uptimeFormatted", "14d 6h");
                    final int latency = json.optInt("latencyMs", 8);

                    new Handler(Looper.getMainLooper()).post(() -> {
                        views.setTextViewText(R.id.widget_single_name, name);
                        views.setTextViewText(R.id.widget_single_ip, ip);
                        views.setTextViewText(R.id.widget_single_uptime, uptime);
                        views.setTextViewText(R.id.widget_single_latency, latency + " ms");

                        String mono = name.length() >= 2 ? name.substring(0, 2).toUpperCase() : name.toUpperCase();
                        views.setTextViewText(R.id.widget_single_icon, mono);

                        if ("offline".equalsIgnoreCase(status)) {
                            views.setTextViewText(R.id.widget_single_status_badge, "🔴 Offline");
                        } else if ("degraded".equalsIgnoreCase(status)) {
                            views.setTextViewText(R.id.widget_single_status_badge, "🟡 Warning");
                        } else {
                            views.setTextViewText(R.id.widget_single_status_badge, "🟢 Online");
                        }

                        if (!svcUrl.isEmpty()) {
                            try {
                                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(svcUrl));
                                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                PendingIntent pi = PendingIntent.getActivity(
                                        context, 501, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                                views.setOnClickPendingIntent(R.id.widget_single_root, pi);
                            } catch (Exception ignored) {}
                        }
                        appWidgetManager.updateAppWidget(appWidgetId, views);
                    });
                }
                conn.disconnect();
            } catch (Exception ignored) {}
        });
    }
}
