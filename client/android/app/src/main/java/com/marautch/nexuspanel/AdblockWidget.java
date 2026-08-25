package com.marautch.nexuspanel;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.Executors;

public class AdblockWidget extends AppWidgetProvider {

    public static final String ACTION_PAUSE_5MIN = "com.marautch.nexuspanel.ACTION_PAUSE_ADBLOCK";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId, false);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_PAUSE_5MIN.equals(intent.getAction())) {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName thisWidget = new ComponentName(context, AdblockWidget.class);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget);
            for (int id : appWidgetIds) {
                updateAppWidget(context, appWidgetManager, id, true);
            }
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId, boolean triggerPause) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_adblock);

        // Click root -> Open App
        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent rootPendingIntent = PendingIntent.getActivity(
                context, 200, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_adblock_root, rootPendingIntent);

        // Click Pause button -> Trigger action
        Intent pauseIntent = new Intent(context, AdblockWidget.class);
        pauseIntent.setAction(ACTION_PAUSE_5MIN);
        PendingIntent pausePendingIntent = PendingIntent.getBroadcast(
                context, 201, pauseIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_btn_pause_adblock, pausePendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);

        // Background update / toggle
        Executors.newSingleThreadExecutor().execute(() -> {
            String serverUrl = "http://192.168.10.96:3000";
            String percent = "22.5%";
            String queries = "84 210";
            String badge = "Ochrona aktywna";

            if (triggerPause) {
                try {
                    URL postUrl = new URL(serverUrl + "/api/widgets/dns-adblock/toggle");
                    HttpURLConnection conn = (HttpURLConnection) postUrl.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Content-Type", "application/json");
                    conn.setDoOutput(true);
                    conn.setConnectTimeout(3000);
                    OutputStream os = conn.getOutputStream();
                    os.write("{\"duration\":300}".getBytes());
                    os.flush();
                    os.close();
                    conn.getResponseCode();
                    conn.disconnect();
                    badge = "Wstrzymano (5 min)";
                } catch (Exception ignored) {}
            }

            try {
                URL url = new URL(serverUrl + "/api/widgets/dns-adblock");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(3000);
                if (conn.getResponseCode() == 200) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) sb.append(line);
                    reader.close();

                    JSONObject json = new JSONObject(sb.toString());
                    percent = json.optDouble("blockedPercentage", 22.5) + "%";
                    queries = String.format("%,d", json.optInt("dnsQueries24h", 84210));
                }
                conn.disconnect();
            } catch (Exception ignored) {}

            final String finalPercent = percent;
            final String finalQueries = queries;
            final String finalBadge = badge;

            new Handler(Looper.getMainLooper()).post(() -> {
                views.setTextViewText(R.id.widget_adblock_percent, finalPercent);
                views.setTextViewText(R.id.widget_adblock_queries, finalQueries);
                views.setTextViewText(R.id.widget_adblock_badge, finalBadge);
                appWidgetManager.updateAppWidget(appWidgetId, views);
            });
        });
    }
}
