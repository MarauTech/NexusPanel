package com.marautch.nexuspanel;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import android.widget.RemoteViews;

import org.json.JSONArray;
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

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_services_status);

        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent rootPendingIntent = PendingIntent.getActivity(
                context, 300 + appWidgetId, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_services_root, rootPendingIntent);

        // 1. Read cached JSON first
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

        // 2. Fetch live metrics from server
        Executors.newSingleThreadExecutor().execute(() -> {
            String serverUrl = WidgetUpdateHelper.getServerUrl(context);
            JSONObject parsed = null;

            // Try primary endpoint
            try {
                URL url = new URL(serverUrl + "/api/widgets/services-summary");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(3500);
                conn.setReadTimeout(3500);
                if (conn.getResponseCode() == 200) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) sb.append(line);
                    reader.close();
                    parsed = new JSONObject(sb.toString());
                }
                conn.disconnect();
            } catch (Exception ignored) {}

            // If primary failed/404, fallback to /api/services
            if (parsed == null) {
                try {
                    URL url = new URL(serverUrl + "/api/services");
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setConnectTimeout(3500);
                    conn.setReadTimeout(3500);
                    if (conn.getResponseCode() == 200) {
                        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                        StringBuilder sb = new StringBuilder();
                        String line;
                        while ((line = reader.readLine()) != null) sb.append(line);
                        reader.close();

                        JSONArray services = new JSONArray(sb.toString());
                        int online = 0;
                        int warning = 0;
                        int offline = 0;
                        for (int i = 0; i < services.length(); i++) {
                            JSONObject s = services.getJSONObject(i);
                            if (s.optInt("enabled", 1) == 0) continue;
                            String st = s.optString("health_status", "unknown");
                            if ("online".equalsIgnoreCase(st)) online++;
                            else if ("degraded".equalsIgnoreCase(st) || "warning".equalsIgnoreCase(st)) warning++;
                            else if ("offline".equalsIgnoreCase(st)) offline++;
                            else online++;
                        }
                        parsed = new JSONObject();
                        parsed.put("total", services.length());
                        parsed.put("online", online);
                        parsed.put("warning", warning);
                        parsed.put("offline", offline);
                    }
                    conn.disconnect();
                } catch (Exception ignored) {}
            }

            if (parsed != null) {
                final JSONObject finalJson = parsed;
                WidgetUpdateHelper.setCachedJson(context, "services_summary", finalJson.toString());
                new Handler(Looper.getMainLooper()).post(() -> {
                    applyServicesSummary(views, finalJson);
                    appWidgetManager.updateAppWidget(appWidgetId, views);
                });
            }
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
