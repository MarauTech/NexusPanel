package com.marautch.nexuspanel;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

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

        // Set pending intents for shortcut slots
        setShortcutIntent(context, views, R.id.widget_shortcut_1, "https://192.168.10.96:8006", 101);
        setShortcutIntent(context, views, R.id.widget_shortcut_2, "http://192.168.10.96:8123", 102);
        setShortcutIntent(context, views, R.id.widget_shortcut_3, "http://192.168.10.96:3000", 103);
        setShortcutIntent(context, views, R.id.widget_shortcut_4, "http://192.168.10.96:8096", 104);

        appWidgetManager.updateAppWidget(appWidgetId, views);
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
