package com.marautch.nexuspanel;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;
import android.net.Uri;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.util.Locale;

public class WidgetUpdateHelper {

    private static final String PREF_NAME = "nexuspanel_widget_prefs";
    private static final String DEFAULT_SERVER_URL = "http://192.168.10.96:3000";

    public static SharedPreferences getPrefs(Context context) {
        return context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
    }

    public static String getServerUrl(Context context) {
        String saved = getPrefs(context).getString("server_url", null);
        if (saved != null && !saved.trim().isEmpty()) {
            return saved.replaceAll("/+$", "");
        }
        return DEFAULT_SERVER_URL;
    }

    public static void setServerUrl(Context context, String url) {
        if (url == null || url.trim().isEmpty()) return;
        getPrefs(context).edit().putString("server_url", url.trim().replaceAll("/+$", "")).apply();
    }

    public static void setWidgetConfig(Context context, int appWidgetId, JSONObject config) {
        if (config == null) return;
        getPrefs(context).edit().putString("widget_config_" + appWidgetId, config.toString()).apply();
    }

    public static JSONObject getWidgetConfig(Context context, int appWidgetId) {
        String jsonStr = getPrefs(context).getString("widget_config_" + appWidgetId, null);
        if (jsonStr != null) {
            try {
                return new JSONObject(jsonStr);
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

    public static void setBrowserPendingIntent(Context context, RemoteViews views, int viewId, String url, int requestCode) {
        if (url == null || url.trim().isEmpty()) return;
        String cleanUrl = url.trim();
        if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
            cleanUrl = "http://" + cleanUrl;
        }

        Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(cleanUrl));
        browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                context, requestCode, browserIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(viewId, pendingIntent);
    }

    /**
     * Generates a high-quality, crisp vector-styled Bitmap logo for a homelab service
     */
    public static Bitmap getServiceIconBitmap(Context context, String name, String iconKey, String colorHex) {
        final int size = 128;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);

        String cleanName = (name != null ? name : "").toLowerCase(Locale.ROOT);
        String cleanIcon = (iconKey != null ? iconKey : "").toLowerCase(Locale.ROOT);

        // Determine base brand colors
        int baseColor = Color.parseColor("#6366F1");
        int gradientTop = Color.parseColor("#4F46E5");
        int gradientBottom = Color.parseColor("#312E81");

        if (cleanName.contains("proxmox") || cleanIcon.contains("proxmox")) {
            baseColor = Color.parseColor("#E57000");
            gradientTop = Color.parseColor("#FF8C00");
            gradientBottom = Color.parseColor("#B34700");
        } else if (cleanName.contains("plex") || cleanIcon.contains("plex")) {
            baseColor = Color.parseColor("#E5A00D");
            gradientTop = Color.parseColor("#FFBA19");
            gradientBottom = Color.parseColor("#A66B00");
        } else if (cleanName.contains("jellyfin") || cleanIcon.contains("jellyfin")) {
            baseColor = Color.parseColor("#9333EA");
            gradientTop = Color.parseColor("#A855F7");
            gradientBottom = Color.parseColor("#581C87");
        } else if (cleanName.contains("immich") || cleanIcon.contains("immich")) {
            baseColor = Color.parseColor("#3B82F6");
            gradientTop = Color.parseColor("#60A5FA");
            gradientBottom = Color.parseColor("#1D4ED8");
        } else if (cleanName.contains("asustor") || cleanIcon.contains("asustor")) {
            baseColor = Color.parseColor("#0284C7");
            gradientTop = Color.parseColor("#38BDF8");
            gradientBottom = Color.parseColor("#0369A1");
        } else if (cleanName.contains("umbrel") || cleanIcon.contains("umbrel")) {
            baseColor = Color.parseColor("#4F46E5");
            gradientTop = Color.parseColor("#6366F1");
            gradientBottom = Color.parseColor("#3730A3");
        } else if (cleanName.contains("home") && (cleanName.contains("assistant") || cleanIcon.contains("assistant") || cleanIcon.contains("home"))) {
            baseColor = Color.parseColor("#0EA5E9");
            gradientTop = Color.parseColor("#38BDF8");
            gradientBottom = Color.parseColor("#0369A1");
        } else if (cleanName.contains("pihole") || cleanName.contains("pi-hole") || cleanIcon.contains("pihole")) {
            baseColor = Color.parseColor("#E11D48");
            gradientTop = Color.parseColor("#F43F5E");
            gradientBottom = Color.parseColor("#9F1239");
        } else if (cleanName.contains("adguard") || cleanIcon.contains("adguard")) {
            baseColor = Color.parseColor("#10B981");
            gradientTop = Color.parseColor("#34D399");
            gradientBottom = Color.parseColor("#047857");
        } else if (cleanName.contains("docker") || cleanName.contains("portainer") || cleanIcon.contains("docker")) {
            baseColor = Color.parseColor("#0284C7");
            gradientTop = Color.parseColor("#38BDF8");
            gradientBottom = Color.parseColor("#075985");
        } else if (cleanName.contains("grafana") || cleanIcon.contains("grafana")) {
            baseColor = Color.parseColor("#F97316");
            gradientTop = Color.parseColor("#FB923C");
            gradientBottom = Color.parseColor("#C2410C");
        } else if (cleanName.contains("truenas") || cleanIcon.contains("truenas")) {
            baseColor = Color.parseColor("#0284C7");
            gradientTop = Color.parseColor("#38BDF8");
            gradientBottom = Color.parseColor("#0c4a6e");
        } else if (colorHex != null && colorHex.startsWith("#") && (colorHex.length() == 7 || colorHex.length() == 9)) {
            try {
                baseColor = Color.parseColor(colorHex);
                gradientTop = baseColor;
                gradientBottom = Color.argb(255, (int)(Color.red(baseColor)*0.7), (int)(Color.green(baseColor)*0.7), (int)(Color.blue(baseColor)*0.7));
            } catch (Exception ignored) {}
        }

        // Draw rounded squircle background
        Paint bgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        bgPaint.setShader(new LinearGradient(0, 0, size, size, gradientTop, gradientBottom, Shader.TileMode.CLAMP));
        RectF rect = new RectF(4, 4, size - 4, size - 4);
        canvas.drawRoundRect(rect, 30f, 30f, bgPaint);

        // Draw subtle inner border
        Paint borderPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        borderPaint.setStyle(Paint.Style.STROKE);
        borderPaint.setStrokeWidth(2.5f);
        borderPaint.setColor(Color.argb(70, 255, 255, 255));
        canvas.drawRoundRect(rect, 30f, 30f, borderPaint);

        // Draw Service Graphic / Logo Glyph
        Paint glyphPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        glyphPaint.setColor(Color.WHITE);
        glyphPaint.setStyle(Paint.Style.FILL);

        if (cleanName.contains("plex") || cleanIcon.contains("plex")) {
            // Plex chevron arrow
            Path path = new Path();
            path.moveTo(42, 32);
            path.lineTo(76, 64);
            path.lineTo(42, 96);
            path.lineTo(58, 96);
            path.lineTo(92, 64);
            path.lineTo(58, 32);
            path.close();
            canvas.drawPath(path, glyphPaint);
        } else if (cleanName.contains("jellyfin") || cleanIcon.contains("jellyfin")) {
            // Jellyfin play gradient symbol
            Path path = new Path();
            path.moveTo(44, 30);
            path.lineTo(96, 64);
            path.lineTo(44, 98);
            path.close();
            canvas.drawPath(path, glyphPaint);
        } else if (cleanName.contains("immich") || cleanIcon.contains("immich")) {
            // Immich camera glyph
            RectF camBody = new RectF(34, 44, 94, 88);
            canvas.drawRoundRect(camBody, 10f, 10f, glyphPaint);
            RectF camTop = new RectF(52, 34, 76, 46);
            canvas.drawRoundRect(camTop, 6f, 6f, glyphPaint);
            Paint cutout = new Paint(Paint.ANTI_ALIAS_FLAG);
            cutout.setColor(baseColor);
            canvas.drawCircle(64, 66, 16f, cutout);
            Paint lens = new Paint(Paint.ANTI_ALIAS_FLAG);
            lens.setColor(Color.WHITE);
            canvas.drawCircle(64, 66, 9f, lens);
        } else if (cleanName.contains("home") && (cleanName.contains("assistant") || cleanIcon.contains("assistant") || cleanIcon.contains("home"))) {
            // Home Assistant House
            Path path = new Path();
            path.moveTo(64, 28);
            path.lineTo(98, 58);
            path.lineTo(86, 58);
            path.lineTo(86, 96);
            path.lineTo(42, 96);
            path.lineTo(42, 58);
            path.lineTo(30, 58);
            path.close();
            canvas.drawPath(path, glyphPaint);
            Paint door = new Paint(Paint.ANTI_ALIAS_FLAG);
            door.setColor(baseColor);
            canvas.drawRoundRect(new RectF(56, 68, 72, 96), 6f, 6f, door);
        } else if (cleanName.contains("asustor") || cleanIcon.contains("asustor") || cleanName.contains("nas")) {
            // NAS Drive Tower with LED lights
            RectF nasBody = new RectF(36, 28, 92, 100);
            canvas.drawRoundRect(nasBody, 12f, 12f, glyphPaint);
            Paint slotPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            slotPaint.setColor(baseColor);
            canvas.drawRoundRect(new RectF(46, 38, 82, 56), 6f, 6f, slotPaint);
            canvas.drawRoundRect(new RectF(46, 62, 82, 80), 6f, 6f, slotPaint);
            Paint ledPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            ledPaint.setColor(Color.parseColor("#34D399"));
            canvas.drawCircle(54, 90, 4f, ledPaint);
            canvas.drawCircle(66, 90, 4f, ledPaint);
        } else if (cleanName.contains("pihole") || cleanName.contains("adguard") || cleanIcon.contains("shield")) {
            // Shield Symbol
            Path path = new Path();
            path.moveTo(64, 26);
            path.lineTo(94, 38);
            path.lineTo(94, 68);
            path.cubicTo(94, 88, 78, 98, 64, 104);
            path.cubicTo(50, 98, 34, 88, 34, 68);
            path.lineTo(34, 38);
            path.close();
            canvas.drawPath(path, glyphPaint);
        } else {
            // Stylized 2-Letter Monogram with Bold Modern Typography
            String text = makeMonogram(name != null && !name.isEmpty() ? name : "NP");
            Paint textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            textPaint.setColor(Color.WHITE);
            textPaint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
            textPaint.setTextSize(48f);
            textPaint.setTextAlign(Paint.Align.CENTER);

            Rect bounds = new Rect();
            textPaint.getTextBounds(text, 0, text.length(), bounds);
            int yPos = (int) ((size / 2f) - ((textPaint.descent() + textPaint.ascent()) / 2f));
            canvas.drawText(text, size / 2f, yPos, textPaint);
        }

        return bitmap;
    }

    public static String makeMonogram(String name) {
        if (name == null || name.trim().isEmpty()) return "NP";
        String clean = name.trim().replaceAll("[^a-zA-Z0-9 ]", "");
        String[] parts = clean.split("\\s+");
        if (parts.length >= 2 && parts[0].length() > 0 && parts[1].length() > 0) {
            return (parts[0].substring(0, 1) + parts[1].substring(0, 1)).toUpperCase(Locale.ROOT);
        }
        if (clean.length() >= 2) {
            return clean.substring(0, 2).toUpperCase(Locale.ROOT);
        }
        return clean.toUpperCase(Locale.ROOT);
    }
}
