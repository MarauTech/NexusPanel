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

public class NexusOverviewWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_nexus_overview);

        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent rootPendingIntent = PendingIntent.getActivity(
                context, 600 + appWidgetId, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_overview_root, rootPendingIntent);

        String cached = WidgetUpdateHelper.getCachedJson(context, "overview");
        if (cached != null && !cached.isEmpty()) {
            try {
                applyOverview(views, new JSONObject(cached));
            } catch (Exception ignored) {}
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);

        Executors.newSingleThreadExecutor().execute(() -> {
            String serverUrl = WidgetUpdateHelper.getServerUrl(context);
            try {
                URL url = new URL(serverUrl + "/api/widgets/overview");
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
                    WidgetUpdateHelper.setCachedJson(context, "overview", raw);
                    JSONObject json = new JSONObject(raw);

                    new Handler(Looper.getMainLooper()).post(() -> {
                        applyOverview(views, json);
                        appWidgetManager.updateAppWidget(appWidgetId, views);
                    });
                }
                conn.disconnect();
            } catch (Exception ignored) {}
        });
    }

    private static void applyOverview(RemoteViews views, JSONObject json) {
        final String systemStatus = json.optString("systemStatus", "System OK");
        final String statusTone = json.optString("statusTone", "online");
        final int cpu = json.optInt("cpuPercent", 0);
        final int ram = json.optInt("ramPercent", 0);
        final String servicesRatio = json.optString("servicesRatio", "0 / 0 usług");
        final int alerts = json.optInt("alertsCount", 0);
        final String uptime = json.optString("uptimeFormatted", "0m");

        views.setTextViewText(R.id.widget_overview_cpu, cpu + "%");
        views.setTextViewText(R.id.widget_overview_ram, ram + "%");
        views.setTextViewText(R.id.widget_overview_services_ratio, servicesRatio);
        views.setTextViewText(R.id.widget_overview_alerts, alerts + " alertów");
        views.setTextViewText(R.id.widget_overview_uptime, uptime);

        if ("offline".equalsIgnoreCase(statusTone)) {
            views.setTextViewText(R.id.widget_overview_system_status, "🔴 " + systemStatus);
        } else if ("warning".equalsIgnoreCase(statusTone)) {
            views.setTextViewText(R.id.widget_overview_system_status, "🟡 " + systemStatus);
        } else {
            views.setTextViewText(R.id.widget_overview_system_status, "🟢 " + systemStatus);
        }
    }
}
