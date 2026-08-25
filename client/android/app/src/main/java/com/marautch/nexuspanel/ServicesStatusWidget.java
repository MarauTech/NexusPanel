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

public class ServicesStatusWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_services_status);

        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent rootPendingIntent = PendingIntent.getActivity(
                context, 300, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_services_root, rootPendingIntent);

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

                    JSONObject json = new JSONObject(sb.toString());
                    final int total = json.optInt("total", 24);
                    final int online = json.optInt("online", 24);
                    final int warning = json.optInt("warning", 0);
                    final int offline = json.optInt("offline", 0);

                    new Handler(Looper.getMainLooper()).post(() -> {
                        views.setTextViewText(R.id.widget_services_total_badge, total + " Usług");
                        views.setTextViewText(R.id.widget_services_online_count, String.valueOf(online));
                        views.setTextViewText(R.id.widget_services_warning_count, String.valueOf(warning));
                        views.setTextViewText(R.id.widget_services_offline_count, String.valueOf(offline));
                        appWidgetManager.updateAppWidget(appWidgetId, views);
                    });
                }
                conn.disconnect();
            } catch (Exception ignored) {}
        });
    }
}
