package com.marautch.nexuspanel;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
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

    @Override
    public void onDeleted(Context context, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            WidgetUpdateHelper.removeWidgetConfig(context, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_favorite_apps);

        // Header click opens NexusPanel
        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent rootPendingIntent = PendingIntent.getActivity(
                context, 100 + appWidgetId, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_fav_badge, rootPendingIntent);

        // Try cached data first
        String cachedJson = WidgetUpdateHelper.getCachedJson(context, "fav_apps_" + appWidgetId);
        if (cachedJson == null) {
            cachedJson = WidgetUpdateHelper.getCachedJson(context, "favorite_apps");
        }
        if (cachedJson != null && !cachedJson.isEmpty()) {
            try {
                applyAppsJson(context, views, appWidgetId, new JSONArray(cachedJson));
            } catch (Exception ignored) {}
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);

        // Fetch live metrics in background
        Executors.newSingleThreadExecutor().execute(() -> {
            String serverUrl = WidgetUpdateHelper.getServerUrl(context);
            String endpoint = serverUrl + "/api/widgets/favorite-apps";

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
                String st = apps.getJSONObject(i).optString("health_status", "unknown");
                if ("online".equalsIgnoreCase(st)) onlineCount++;
            } catch (Exception ignored) {}
        }
        views.setTextViewText(R.id.widget_fav_badge, onlineCount + "/" + apps.length() + " Online");

        for (int i = 0; i < 4; i++) {
            if (i < apps.length()) {
                try {
                    JSONObject app = apps.getJSONObject(i);
                    String name = app.optString("name", "Usługa");
                    String ip = app.optString("ip", "--");
                    String svcUrl = app.optString("url", "");
                    String icon = app.optString("icon", "globe");
                    String color = app.optString("color", "#6366F1");
                    String status = app.optString("health_status", "unknown");

                    views.setViewVisibility(cardViews[i], View.VISIBLE);
                    views.setTextViewText(nameViews[i], name);
                    views.setTextViewText(ipViews[i], ip);

                    Bitmap iconBmp = WidgetUpdateHelper.getServiceIconBitmap(context, name, icon, color);
                    views.setImageViewBitmap(iconViews[i], iconBmp);

                    if ("online".equalsIgnoreCase(status)) {
                        views.setImageViewResource(statusViews[i], R.drawable.widget_status_online);
                    } else if ("degraded".equalsIgnoreCase(status) || "warning".equalsIgnoreCase(status)) {
                        views.setImageViewResource(statusViews[i], R.drawable.widget_status_warning);
                    } else if ("offline".equalsIgnoreCase(status)) {
                        views.setImageViewResource(statusViews[i], R.drawable.widget_status_offline);
                    } else {
                        views.setImageViewResource(statusViews[i], R.drawable.widget_status_warning);
                    }

                    // Open exact URL in default browser!
                    WidgetUpdateHelper.setBrowserPendingIntent(context, views, cardViews[i], svcUrl, (appWidgetId * 100) + i);
                } catch (Exception ignored) {}
            } else {
                views.setViewVisibility(cardViews[i], View.INVISIBLE);
            }
        }
    }
}
