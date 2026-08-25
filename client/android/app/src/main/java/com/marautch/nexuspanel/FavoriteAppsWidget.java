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
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.Executors;

public class FavoriteAppsWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_favorite_apps);

        // Click on header -> open NexusPanel app
        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent rootPendingIntent = PendingIntent.getActivity(
                context, 100, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_fav_root, rootPendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);

        // Background network fetch for max 4 favorite apps
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
                URL url = new URL(serverUrl + "/api/widgets/favorite-apps");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(3500);
                conn.setReadTimeout(3500);
                if (conn.getResponseCode() == 200) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) sb.append(line);
                    reader.close();

                    JSONArray apps = new JSONArray(sb.toString());
                    int onlineCount = 0;
                    for (int i = 0; i < apps.length(); i++) {
                        String st = apps.getJSONObject(i).optString("health_status", "online");
                        if (!"offline".equalsIgnoreCase(st)) {
                            onlineCount++;
                        }
                    }

                    final JSONArray finalApps = apps;
                    final int finalOnline = onlineCount;
                    final int finalTotal = apps.length();

                    new Handler(Looper.getMainLooper()).post(() -> {
                        int[] cardViews = {R.id.widget_fav_card_1, R.id.widget_fav_card_2, R.id.widget_fav_card_3, R.id.widget_fav_card_4};
                        int[] nameViews = {R.id.widget_fav_name_1, R.id.widget_fav_name_2, R.id.widget_fav_name_3, R.id.widget_fav_name_4};
                        int[] ipViews = {R.id.widget_fav_ip_1, R.id.widget_fav_ip_2, R.id.widget_fav_ip_3, R.id.widget_fav_ip_4};
                        int[] iconViews = {R.id.widget_fav_icon_1, R.id.widget_fav_icon_2, R.id.widget_fav_icon_3, R.id.widget_fav_icon_4};
                        int[] statusViews = {R.id.widget_fav_status_1, R.id.widget_fav_status_2, R.id.widget_fav_status_3, R.id.widget_fav_status_4};

                        views.setTextViewText(R.id.widget_fav_badge, finalOnline + "/" + finalTotal + " Online");

                        for (int i = 0; i < 4; i++) {
                            if (i < finalApps.length()) {
                                try {
                                    JSONObject app = finalApps.getJSONObject(i);
                                    String name = app.optString("name", "Usługa");
                                    String ip = app.optString("ip", "192.168.1.1");
                                    String svcUrl = app.optString("url", "");
                                    String status = app.optString("health_status", "online");

                                    views.setViewVisibility(cardViews[i], View.VISIBLE);
                                    views.setTextViewText(nameViews[i], name);
                                    views.setTextViewText(ipViews[i], ip);

                                    // 2-letter monogram
                                    String mono = makeMonogram(name);
                                    views.setTextViewText(iconViews[i], mono);

                                    // Status Dot (🟢 Online / 🟡 Degraded / 🔴 Offline)
                                    if ("offline".equalsIgnoreCase(status)) {
                                        views.setImageViewResource(statusViews[i], R.drawable.widget_status_offline);
                                    } else {
                                        views.setImageViewResource(statusViews[i], R.drawable.widget_status_online);
                                    }

                                    // Click on card -> Opens configured URL immediately
                                    if (!svcUrl.isEmpty()) {
                                        setShortcutIntent(context, views, cardViews[i], svcUrl, 110 + i);
                                    }
                                } catch (Exception ignored) {}
                            } else {
                                views.setViewVisibility(cardViews[i], View.INVISIBLE);
                            }
                        }
                        appWidgetManager.updateAppWidget(appWidgetId, views);
                    });
                }
                conn.disconnect();
            } catch (Exception ignored) {}
        });
    }

    private static String makeMonogram(String name) {
        if (name == null || name.trim().isEmpty()) return "NP";
        String clean = name.trim();
        String[] parts = clean.split("\\s+");
        if (parts.length >= 2 && parts[0].length() > 0 && parts[1].length() > 0) {
            return ("" + parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        }
        return (clean.length() >= 2 ? clean.substring(0, 2) : clean).toUpperCase();
    }

    private static void setShortcutIntent(Context context, RemoteViews views, int viewId, String url, int requestCode) {
        Intent intent;
        try {
            intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        } catch (Exception e) {
            intent = new Intent(context, MainActivity.class);
        }
        PendingIntent pi = PendingIntent.getActivity(
                context, requestCode, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(viewId, pi);
    }
}
