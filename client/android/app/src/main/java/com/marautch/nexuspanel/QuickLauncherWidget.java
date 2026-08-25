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

public class QuickLauncherWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_quick_launcher);

        // Click on header -> open NexusPanel app
        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent rootPendingIntent = PendingIntent.getActivity(
                context, 100, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_launcher_root, rootPendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);

        // Background network fetch for real favorite services
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
                conn.setConnectTimeout(3500);
                conn.setReadTimeout(3500);
                if (conn.getResponseCode() == 200) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) sb.append(line);
                    reader.close();

                    JSONArray allServices = new JSONArray(sb.toString());
                    JSONArray favorites = new JSONArray();
                    int onlineCount = 0;

                    for (int i = 0; i < allServices.length(); i++) {
                        JSONObject s = allServices.getJSONObject(i);
                        boolean isFav = s.optInt("favorite", 0) == 1 || s.optBoolean("favorite", false);
                        if (isFav) {
                            favorites.put(s);
                        }
                    }

                    // Fallback to first services if none marked as favorite
                    if (favorites.length() == 0) {
                        for (int i = 0; i < Math.min(6, allServices.length()); i++) {
                            favorites.put(allServices.getJSONObject(i));
                        }
                    }

                    for (int i = 0; i < favorites.length(); i++) {
                        String status = favorites.getJSONObject(i).optString("health_status", "online");
                        if (!"offline".equalsIgnoreCase(status)) {
                            onlineCount++;
                        }
                    }

                    final JSONArray finalFavs = favorites;
                    final int finalOnline = onlineCount;
                    final int finalTotal = favorites.length();

                    new Handler(Looper.getMainLooper()).post(() -> {
                        int[] nameViews = {
                                R.id.widget_app_1_name, R.id.widget_app_2_name,
                                R.id.widget_app_3_name, R.id.widget_app_4_name,
                                R.id.widget_app_5_name, R.id.widget_app_6_name
                        };
                        int[] descViews = {
                                R.id.widget_tile_1_desc, R.id.widget_tile_2_desc,
                                R.id.widget_tile_3_desc, R.id.widget_tile_4_desc,
                                R.id.widget_tile_5_desc, R.id.widget_tile_6_desc
                        };
                        int[] iconViews = {
                                R.id.widget_tile_1_icon, R.id.widget_tile_2_icon,
                                R.id.widget_tile_3_icon, R.id.widget_tile_4_icon,
                                R.id.widget_tile_5_icon, R.id.widget_tile_6_icon
                        };
                        int[] statusViews = {
                                R.id.widget_tile_1_status, R.id.widget_tile_2_status,
                                R.id.widget_tile_3_status, R.id.widget_tile_4_status,
                                R.id.widget_tile_5_status, R.id.widget_tile_6_status
                        };
                        int[] tileViews = {
                                R.id.widget_shortcut_1, R.id.widget_shortcut_2,
                                R.id.widget_shortcut_3, R.id.widget_shortcut_4,
                                R.id.widget_shortcut_5, R.id.widget_shortcut_6
                        };

                        views.setTextViewText(R.id.widget_fav_count, finalOnline + "/" + finalTotal + " Online");

                        for (int i = 0; i < 6; i++) {
                            if (i < finalFavs.length()) {
                                try {
                                    JSONObject svc = finalFavs.getJSONObject(i);
                                    String name = svc.optString("name", "Usługa");
                                    String desc = svc.optString("description", "");
                                    if (desc.isEmpty() && svc.has("category_name")) {
                                        desc = svc.optString("category_name", "");
                                    }
                                    String svcUrl = svc.optString("url", "");
                                    String status = svc.optString("health_status", "online");

                                    views.setViewVisibility(tileViews[i], View.VISIBLE);
                                    views.setTextViewText(nameViews[i], name);
                                    views.setTextViewText(descViews[i], desc.isEmpty() ? "Aktywna" : desc);

                                    // 2-character uppercase monogram (e.g. PX, HA, AG, JF, PT, GF)
                                    String monogram = makeMonogram(name);
                                    views.setTextViewText(iconViews[i], monogram);

                                    // Status Dot
                                    if ("offline".equalsIgnoreCase(status)) {
                                        views.setImageViewResource(statusViews[i], R.drawable.widget_status_offline);
                                    } else {
                                        views.setImageViewResource(statusViews[i], R.drawable.widget_status_online);
                                    }

                                    // Click Intent
                                    if (!svcUrl.isEmpty()) {
                                        setShortcutIntent(context, views, tileViews[i], svcUrl, 300 + i);
                                    }
                                } catch (Exception ignored) {}
                            } else {
                                // Hide unused slot if fewer than 6 services
                                views.setViewVisibility(tileViews[i], View.INVISIBLE);
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
