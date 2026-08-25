package com.marautch.nexuspanel;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
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

    @Override
    public void onDeleted(Context context, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            WidgetUpdateHelper.removeWidgetConfig(context, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_single_service);

        // Header click opens NexusPanel
        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent rootPendingIntent = PendingIntent.getActivity(
                context, 500 + appWidgetId, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_single_status_badge, rootPendingIntent);

        // Read specific configuration for this widget instance
        JSONObject config = WidgetUpdateHelper.getWidgetConfig(context, appWidgetId);
        int serviceId = config.optInt("service_id", 0);
        String configuredName = config.optString("service_name", "");
        String configuredUrl = config.optString("service_url", "");
        String configuredIp = config.optString("service_ip", "");

        // If we have configured info, render immediately with graceful defaults
        if (!configuredName.isEmpty()) {
            views.setTextViewText(R.id.widget_single_name, configuredName);
            views.setTextViewText(R.id.widget_single_ip, configuredIp);
            views.setTextViewText(R.id.widget_single_icon, WidgetUpdateHelper.makeMonogram(configuredName));
            views.setTextViewText(R.id.widget_single_status_badge, "⚪ Unknown");
            views.setTextViewText(R.id.widget_single_uptime, "--");
            views.setTextViewText(R.id.widget_single_latency, "--");
            WidgetUpdateHelper.setBrowserPendingIntent(context, views, R.id.widget_single_root, configuredUrl, (appWidgetId * 100) + 50);
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);

        // Fetch live metrics in background
        Executors.newSingleThreadExecutor().execute(() -> {
            String serverUrl = WidgetUpdateHelper.getServerUrl(context);
            String endpoint = serviceId > 0 
                    ? (serverUrl + "/api/widgets/service-monitor/" + serviceId)
                    : (serverUrl + "/api/widgets/service-monitor");

            try {
                URL url = new URL(endpoint);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(4000);
                conn.setReadTimeout(4000);
                if (conn.getResponseCode() == 200) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) sb.append(line);
                    reader.close();

                    JSONObject json = new JSONObject(sb.toString());
                    final String name = json.optString("name", configuredName.isEmpty() ? "Usługa" : configuredName);
                    final String ip = json.optString("ip", configuredIp.isEmpty() ? "--" : configuredIp);
                    final String svcUrl = json.optString("url", configuredUrl);
                    final String status = json.optString("status", "unknown");
                    final String uptime = json.optString("uptimeFormatted", "--");
                    final boolean hasLatency = json.has("latencyMs") && !json.isNull("latencyMs");
                    final String latency = hasLatency ? (json.optInt("latencyMs") + " ms") : "--";

                    new Handler(Looper.getMainLooper()).post(() -> {
                        views.setTextViewText(R.id.widget_single_name, name);
                        views.setTextViewText(R.id.widget_single_ip, ip);
                        views.setTextViewText(R.id.widget_single_icon, WidgetUpdateHelper.makeMonogram(name));
                        views.setTextViewText(R.id.widget_single_uptime, uptime);
                        views.setTextViewText(R.id.widget_single_latency, latency);

                        if ("online".equalsIgnoreCase(status)) {
                            views.setTextViewText(R.id.widget_single_status_badge, "🟢 Online");
                        } else if ("degraded".equalsIgnoreCase(status) || "warning".equalsIgnoreCase(status)) {
                            views.setTextViewText(R.id.widget_single_status_badge, "🟡 Warning");
                        } else if ("offline".equalsIgnoreCase(status)) {
                            views.setTextViewText(R.id.widget_single_status_badge, "🔴 Offline");
                        } else {
                            views.setTextViewText(R.id.widget_single_status_badge, "⚪ Unknown");
                        }

                        // Set direct browser click on the entire card
                        WidgetUpdateHelper.setBrowserPendingIntent(context, views, R.id.widget_single_root, svcUrl, (appWidgetId * 100) + 50);
                        appWidgetManager.updateAppWidget(appWidgetId, views);
                    });
                }
                conn.disconnect();
            } catch (Exception ignored) {}
        });
    }
}
