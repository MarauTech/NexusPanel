package com.marautch.nexuspanel;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;

import org.json.JSONObject;

public class WidgetUpdateHelper {

    public static final String PREFS_NAME = "NexusPanelWidgetPrefs";
    public static final String KEY_SERVER_URL = "server_url";

    public static SharedPreferences getPrefs(Context context) {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    public static String getServerUrl(Context context) {
        SharedPreferences prefs = getPrefs(context);
        String url = prefs.getString(KEY_SERVER_URL, null);
        if (url != null && !url.trim().isEmpty()) {
            return url.trim().replaceAll("/+$", "");
        }
        return "http://192.168.10.96:3000";
    }

    public static void setServerUrl(Context context, String serverUrl) {
        if (serverUrl == null) return;
        String clean = serverUrl.trim().replaceAll("/+$", "");
        if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
            clean = "http://" + clean;
        }
        getPrefs(context).edit().putString(KEY_SERVER_URL, clean).apply();
    }

    public static void saveWidgetConfig(Context context, int appWidgetId, String jsonPayload) {
        getPrefs(context).edit().putString("widget_config_" + appWidgetId, jsonPayload).apply();
    }

    public static JSONObject getWidgetConfig(Context context, int appWidgetId) {
        String json = getPrefs(context).getString("widget_config_" + appWidgetId, null);
        if (json != null && !json.trim().isEmpty()) {
            try {
                return new JSONObject(json);
            } catch (Exception ignored) {}
        }
        return new JSONObject();
    }

    public static void removeWidgetConfig(Context context, int appWidgetId) {
        getPrefs(context).edit().remove("widget_config_" + appWidgetId).apply();
    }

    public static void setCachedJson(Context context, String key, String jsonPayload) {
        if (key == null || jsonPayload == null) return;
        getPrefs(context).edit().putString("cache_" + key, jsonPayload).apply();
    }

    public static String getCachedJson(Context context, String key) {
        return getPrefs(context).getString("cache_" + key, null);
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);

        int[] favIds = manager.getAppWidgetIds(new ComponentName(context, FavoriteAppsWidget.class));
        for (int id : favIds) {
            FavoriteAppsWidget.updateAppWidget(context, manager, id);
        }

        int[] srvIds = manager.getAppWidgetIds(new ComponentName(context, ServerStatusWidget.class));
        for (int id : srvIds) {
            ServerStatusWidget.updateAppWidget(context, manager, id);
        }

        int[] sumIds = manager.getAppWidgetIds(new ComponentName(context, ServicesStatusWidget.class));
        for (int id : sumIds) {
            ServicesStatusWidget.updateAppWidget(context, manager, id);
        }

        int[] upIds = manager.getAppWidgetIds(new ComponentName(context, UptimeWidget.class));
        for (int id : upIds) {
            UptimeWidget.updateAppWidget(context, manager, id);
        }

        int[] singleIds = manager.getAppWidgetIds(new ComponentName(context, SingleServiceWidget.class));
        for (int id : singleIds) {
            SingleServiceWidget.updateAppWidget(context, manager, id);
        }

        int[] overIds = manager.getAppWidgetIds(new ComponentName(context, NexusOverviewWidget.class));
        for (int id : overIds) {
            NexusOverviewWidget.updateAppWidget(context, manager, id);
        }
    }

    public static void setBrowserPendingIntent(Context context, RemoteViews views, int viewId, String rawUrl, int requestCode) {
        if (rawUrl == null || rawUrl.trim().isEmpty()) {
            Intent appIntent = new Intent(context, MainActivity.class);
            PendingIntent pi = PendingIntent.getActivity(context, requestCode, appIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(viewId, pi);
            return;
        }

        String clean = rawUrl.trim();
        if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
            clean = "http://" + clean;
        }

        try {
            Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(clean));
            browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            PendingIntent pi = PendingIntent.getActivity(context, requestCode, browserIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(viewId, pi);
        } catch (Exception e) {
            Intent appIntent = new Intent(context, MainActivity.class);
            PendingIntent pi = PendingIntent.getActivity(context, requestCode, appIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(viewId, pi);
        }
    }

    public static String makeMonogram(String name) {
        if (name == null || name.trim().isEmpty()) return "NP";
        String clean = name.trim();
        String[] parts = clean.split("\\s+");
        if (parts.length >= 2 && parts[0].length() > 0 && parts[1].length() > 0) {
            return ("" + parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        }
        return (clean.length() >= 2 ? clean.substring(0, 2) : clean).toUpperCase();
    }
}
