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

        // Header click opens NexusPanel
        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent rootPendingIntent = PendingIntent.getActivity(
                context, 100, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_fav_badge, rootPendingIntent);

        // 1. Try to render cached JSON immediately
        String cachedJson = WidgetUpdateHelper.getCachedJson(context, "favorite_apps");
        if (cachedJson != null && !cachedJson.isEmpty()) {
            try {
                applyAppsJson(context, views, appWidgetId, new JSONArray(cachedJson));
            } catch (Exception ignored) {}
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);

        // 2. Fetch live data from server in background
        Executors.newSingleThreadExecutor().execute(() -> {
            String serverUrl = WidgetUpdateHelper.getServerUrl(context);
            try {
                URL url = new URL(serverUrl + "/api/widgets/favorite-apps");
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
                    WidgetUpdateHelper.setCachedJson(context, "favorite_apps", raw);
                    JSONArray apps = new JSONArray(raw);

                    new Handler(Looper.getMainLooper()).post(() -> {
                        applyAppsJson(context, views, appWidgetId, apps);
                        appWidgetManager.updateAppWidget(appWidgetId, views);
                    });
                }
                conn.disconnect();
            } catch (Exception ignored) {}
        });
    }

    private static void applyAppsJson(Context context, RemoteViews views, int appWidgetId, JSONArray apps) {
        int[] cardViews = {R.id.widget_fav_card_1, R.id.widget_fav_card_2, R.id.widget_fav_card_3, R.id.widget_fav_card_4};
        int[] nameViews = {R.id.widget_fav_name_1, R.id.widget_fav_name_2, R.id.widget_fav_name_3, R.id.widget_fav_name_4};
        int[] ipViews = {R.id.widget_fav_ip_1, R.id.widget_fav_ip_2, R.id.widget_fav_ip_3, R.id.widget_fav_ip_4};
        int[] iconViews = {R.id.widget_fav_icon_1, R.id.widget_fav_icon_2, R.id.widget_fav_icon_3, R.id.widget_fav_icon_4};
        int[] statusViews = {R.id.widget_fav_status_1, R.id.widget_fav_status_2, R.id.widget_fav_status_3, R.id.widget_fav_status_4};

        int onlineCount = 0;
        for (int i = 0; i < apps.length(); i++) {
            try {
                String st = apps.getJSONObject(i).optString("health_status", "online");
                if (!"offline".equalsIgnoreCase(st)) onlineCount++;
            } catch (Exception ignored) {}
        }
        views.setTextViewText(R.id.widget_fav_badge, onlineCount + "/" + apps.length() + " Online");

        for (int i = 0; i < 4; i++) {
            if (i < apps.length()) {
                try {
                    JSONObject app = apps.getJSONObject(i);
                    String name = app.optString("name", "Usługa");
                    String ip = app.optString("ip", "192.168.1.1");
                    String svcUrl = app.optString("url", "");
                    String status = app.optString("health_status", "online");

                    views.setViewVisibility(cardViews[i], View.VISIBLE);
                    views.setTextViewText(nameViews[i], name);
                    views.setTextViewText(ipViews[i], ip);

                    String mono = makeMonogram(name);
                    views.setTextViewText(iconViews[i], mono);

                    if ("offline".equalsIgnoreCase(status)) {
                        views.setImageViewResource(statusViews[i], R.drawable.widget_status_offline);
                    } else if ("degraded".equalsIgnoreCase(status)) {
                        views.setImageViewResource(statusViews[i], R.drawable.widget_status_warning);
                    } else {
                        views.setImageViewResource(statusViews[i], R.drawable.widget_status_online);
                    }

                    // OPEN BROWSER DIRECTLY TO THE SERVICE URL
                    WidgetUpdateHelper.setBrowserPendingIntent(context, views, cardViews[i], svcUrl, (appWidgetId * 100) + i);
                } catch (Exception ignored) {}
            } else {
                views.setViewVisibility(cardViews[i], View.INVISIBLE);
            }
        }
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
}
