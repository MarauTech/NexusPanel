package com.marautch.nexuspanel;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;

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

    public static void setCachedJson(Context context, String widgetType, String jsonPayload) {
        if (widgetType == null || jsonPayload == null) return;
        getPrefs(context).edit().putString("widget_data_" + widgetType, jsonPayload).apply();
    }

    public static String getCachedJson(Context context, String widgetType) {
        return getPrefs(context).getString("widget_data_" + widgetType, null);
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);

        int[] favIds = manager.getAppWidgetIds(new ComponentName(context, FavoriteAppsWidget.class));
        if (favIds.length > 0) {
            Intent intent = new Intent(context, FavoriteAppsWidget.class);
            intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, favIds);
            context.sendBroadcast(intent);
        }

        int[] srvIds = manager.getAppWidgetIds(new ComponentName(context, ServerStatusWidget.class));
        if (srvIds.length > 0) {
            Intent intent = new Intent(context, ServerStatusWidget.class);
            intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, srvIds);
            context.sendBroadcast(intent);
        }

        int[] sumIds = manager.getAppWidgetIds(new ComponentName(context, ServicesStatusWidget.class));
        if (sumIds.length > 0) {
            Intent intent = new Intent(context, ServicesStatusWidget.class);
            intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, sumIds);
            context.sendBroadcast(intent);
        }

        int[] upIds = manager.getAppWidgetIds(new ComponentName(context, UptimeWidget.class));
        if (upIds.length > 0) {
            Intent intent = new Intent(context, UptimeWidget.class);
            intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, upIds);
            context.sendBroadcast(intent);
        }

        int[] singleIds = manager.getAppWidgetIds(new ComponentName(context, SingleServiceWidget.class));
        if (singleIds.length > 0) {
            Intent intent = new Intent(context, SingleServiceWidget.class);
            intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, singleIds);
            context.sendBroadcast(intent);
        }

        int[] overIds = manager.getAppWidgetIds(new ComponentName(context, NexusOverviewWidget.class));
        if (overIds.length > 0) {
            Intent intent = new Intent(context, NexusOverviewWidget.class);
            intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, overIds);
            context.sendBroadcast(intent);
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
}
