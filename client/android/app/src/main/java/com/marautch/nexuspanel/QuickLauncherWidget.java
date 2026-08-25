package com.marautch.nexuspanel;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
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

public class QuickLauncherWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_quick_launcher);

        // Click on root opens main app
        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent rootPendingIntent = PendingIntent.getActivity(
                context, 100, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_launcher_root, rootPendingIntent);

        // Set initial fallback intents
        setShortcutIntent(context, views, R.id.widget_shortcut_1, "https://192.168.10.96:8006", 101);
        setShortcutIntent(context, views, R.id.widget_shortcut_2, "http://192.168.10.96:8123", 102);
        setShortcutIntent(context, views, R.id.widget_shortcut_3, "http://192.168.10.96:3000", 103);
        setShortcutIntent(context, views, R.id.widget_shortcut_4, "http://192.168.10.96:8096", 104);

        appWidgetManager.updateAppWidget(appWidgetId, views);

        // Background network fetch for user's actual favorite services
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
                URL url = new URL(serverUrl + "/api/services");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(4000);
                conn.setReadTimeout(4000);
                if (conn.getResponseCode() == 200) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) sb.append(line);
                    reader.close();

                    JSONArray arr = new JSONArray(sb.toString());
                    JSONArray favorites = new JSONArray();
                    for (int i = 0; i < arr.length(); i++) {
                        JSONObject s = arr.getJSONObject(i);
                        if (s.optInt("favorite", 0) == 1 || s.optBoolean("favorite", false)) {
                            favorites.put(s);
                        }
                    }
                    if (favorites.length() == 0) {
                        favorites = arr; // fallback to first services if none starred
                    }

                    final JSONArray finalFavs = favorites;
                    new Handler(Looper.getMainLooper()).post(() -> {
                        int[] nameViews = {R.id.widget_app_1_name, R.id.widget_app_2_name, R.id.widget_app_3_name, R.id.widget_app_4_name};
                        int[] descViews = {R.id.widget_tile_1_desc, R.id.widget_tile_2_desc, R.id.widget_tile_3_desc, R.id.widget_tile_4_desc};
                        int[] iconViews = {R.id.widget_tile_1_icon, R.id.widget_tile_2_icon, R.id.widget_tile_3_icon, R.id.widget_tile_4_icon};
                        int[] statusViews = {R.id.widget_tile_1_status, R.id.widget_tile_2_status, R.id.widget_tile_3_status, R.id.widget_tile_4_status};
                        int[] tileViews = {R.id.widget_shortcut_1, R.id.widget_shortcut_2, R.id.widget_shortcut_3, R.id.widget_shortcut_4};

                        views.setTextViewText(R.id.widget_fav_count, finalFavs.length() + " Ulubionych");

                        for (int i = 0; i < 4 && i < finalFavs.length(); i++) {
                            try {
                                JSONObject svc = finalFavs.getJSONObject(i);
                                String name = svc.optString("name", "Usługa");
                                String desc = svc.optString("description", "");
                                if (desc.isEmpty() && svc.has("category_name")) {
                                    desc = svc.optString("category_name", "");
                                }
                                String svcUrl = svc.optString("url", "");
                                String status = svc.optString("health_status", "online");

                                views.setTextViewText(nameViews[i], name);
                                views.setTextViewText(descViews[i], desc.isEmpty() ? "Aktywna" : desc);
                                
                                // Initial letter
                                String initial = name.length() > 2 ? name.substring(0, 2).toUpperCase() : name.toUpperCase();
                                views.setTextViewText(iconViews[i], initial);

                                // Status dot
                                if ("offline".equalsIgnoreCase(status)) {
                                    views.setImageViewResource(statusViews[i], R.drawable.widget_status_offline);
                                } else {
                                    views.setImageViewResource(statusViews[i], R.drawable.widget_status_online);
                                }

                                if (!svcUrl.isEmpty()) {
                                    setShortcutIntent(context, views, tileViews[i], svcUrl, 200 + i);
                                }
                            } catch (Exception ignored) {}
                        }
                        appWidgetManager.updateAppWidget(appWidgetId, views);
                    });
                }
                conn.disconnect();
            } catch (Exception ignored) {}
        });
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
