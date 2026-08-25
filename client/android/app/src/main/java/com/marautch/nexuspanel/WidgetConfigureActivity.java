package com.marautch.nexuspanel;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProviderInfo;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.LinearLayout;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executors;

public class WidgetConfigureActivity extends Activity {

    private int mAppWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID;
    private String mWidgetType = "single_service";
    private LinearLayout mContainer;
    private TextView mTitle;
    private TextView mSubtitle;
    private Button mBtnSave;

    private List<ServiceItem> mServices = new ArrayList<>();
    private Spinner mServiceSpinner;
    private CheckBox mCbStatus, mCbIp, mCbUptime, mCbLatency;
    private List<CheckBox> mFavCheckBoxes = new ArrayList<>();

    static class ServiceItem {
        int id;
        String name;
        String url;
        String ip;
        String status;

        @Override
        public String toString() {
            return name + " (" + ip + ")";
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setResult(RESULT_CANCELED);
        setContentView(R.layout.activity_widget_configure);

        Intent intent = getIntent();
        Bundle extras = intent.getExtras();
        if (extras != null) {
            mAppWidgetId = extras.getInt(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
        }

        if (mAppWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish();
            return;
        }

        mContainer = findViewById(R.id.cfg_container);
        mTitle = findViewById(R.id.cfg_title);
        mSubtitle = findViewById(R.id.cfg_subtitle);
        mBtnSave = findViewById(R.id.cfg_btn_save);

        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(this);
        AppWidgetProviderInfo info = appWidgetManager.getAppWidgetInfo(mAppWidgetId);
        if (info != null && info.provider != null) {
            String className = info.provider.getClassName();
            if (className.contains("SingleServiceWidget")) {
                mWidgetType = "single_service";
                mTitle.setText("Monitoring Usługi");
                mSubtitle.setText("Wybierz usługę z panelu i wskaż widoczne wskaźniki");
            } else if (className.contains("FavoriteAppsWidget")) {
                mWidgetType = "favorite_apps";
                mTitle.setText("Ulubione Aplikacje");
                mSubtitle.setText("Wybierz maksymalnie 4 usługi na ekran główny");
            } else if (className.contains("ServerStatusWidget")) {
                mWidgetType = "server_status";
                mTitle.setText("Status Serwera");
                mSubtitle.setText("Konfiguracja monitorowania zasobów hosta");
            } else if (className.contains("ServicesStatusWidget")) {
                mWidgetType = "services_status";
                mTitle.setText("Status Usług");
                mSubtitle.setText("Zbiorczy licznik stanu wszystkich usług");
            } else if (className.contains("UptimeWidget")) {
                mWidgetType = "uptime";
                mTitle.setText("Wskaźnik Uptime");
                mSubtitle.setText("Monitorowanie dostępności panelu i usług");
            } else if (className.contains("NexusOverviewWidget")) {
                mWidgetType = "nexus_overview";
                mTitle.setText("Nexus Overview");
                mSubtitle.setText("Konfiguracja zbiorczego pulpitu");
            }
        }

        mBtnSave.setOnClickListener(v -> saveAndFinish());

        loadServicesList();
    }

    private void loadServicesList() {
        Executors.newSingleThreadExecutor().execute(() -> {
            String serverUrl = WidgetUpdateHelper.getServerUrl(this);
            List<ServiceItem> items = new ArrayList<>();
            try {
                URL url = new URL(serverUrl + "/api/widgets/services-list");
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
                    for (int i = 0; i < arr.length(); i++) {
                        JSONObject obj = arr.getJSONObject(i);
                        ServiceItem s = new ServiceItem();
                        s.id = obj.optInt("id");
                        s.name = obj.optString("name", "Usługa");
                        s.url = obj.optString("url", "");
                        s.ip = obj.optString("ip", "192.168.1.1");
                        s.status = obj.optString("health_status", "unknown");
                        items.add(s);
                    }
                }
                conn.disconnect();
            } catch (Exception ignored) {}

            new Handler(Looper.getMainLooper()).post(() -> {
                mServices = items;
                buildConfigurationUI();
            });
        });
    }

    private void buildConfigurationUI() {
        mContainer.removeAllViews();

        if ("single_service".equals(mWidgetType)) {
            TextView lblService = new TextView(this);
            lblService.setText("Wybierz usługę do monitorowania:");
            lblService.setTextColor(Color.parseColor("#94A3B8"));
            lblService.setTextSize(13f);
            lblService.setPadding(0, 0, 0, 10);
            mContainer.addView(lblService);

            mServiceSpinner = new Spinner(this);
            if (!mServices.isEmpty()) {
                ArrayAdapter<ServiceItem> adapter = new ArrayAdapter<>(this,
                        android.R.layout.simple_spinner_dropdown_item, mServices);
                mServiceSpinner.setAdapter(adapter);
            }
            mServiceSpinner.setBackgroundResource(R.drawable.widget_chip_bg);
            mServiceSpinner.setPadding(12, 12, 12, 12);
            mContainer.addView(mServiceSpinner);

            TextView lblOptions = new TextView(this);
            lblOptions.setText("Widoczne elementy:");
            lblOptions.setTextColor(Color.parseColor("#94A3B8"));
            lblOptions.setTextSize(13f);
            lblOptions.setPadding(0, 24, 0, 10);
            mContainer.addView(lblOptions);

            mCbStatus = createCheckBox("Status połączenia (Online / Offline)", true);
            mCbIp = createCheckBox("Adres IP / Hostname", true);
            mCbUptime = createCheckBox("Czas pracy (Uptime)", true);
            mCbLatency = createCheckBox("Czas odpowiedzi (Latency ms)", true);

            mContainer.addView(mCbStatus);
            mContainer.addView(mCbIp);
            mContainer.addView(mCbUptime);
            mContainer.addView(mCbLatency);

        } else if ("favorite_apps".equals(mWidgetType)) {
            TextView lblDesc = new TextView(this);
            lblDesc.setText("Zaznacz maksymalnie 4 usługi na ten widżet:");
            lblDesc.setTextColor(Color.parseColor("#94A3B8"));
            lblDesc.setTextSize(13f);
            lblDesc.setPadding(0, 0, 0, 16);
            mContainer.addView(lblDesc);

            mFavCheckBoxes.clear();
            for (ServiceItem s : mServices) {
                CheckBox cb = createCheckBox(s.name + " (" + s.ip + ")", false);
                cb.setTag(s.id);
                cb.setOnCheckedChangeListener((buttonView, isChecked) -> {
                    int checkedCount = 0;
                    for (CheckBox c : mFavCheckBoxes) {
                        if (c.isChecked()) checkedCount++;
                    }
                    if (checkedCount > 4) {
                        buttonView.setChecked(false);
                        Toast.makeText(this, "Maksymalnie możesz wybrać 4 usługi!", Toast.LENGTH_SHORT).show();
                    }
                });
                mFavCheckBoxes.add(cb);
                mContainer.addView(cb);
            }

            // Check first 4 by default if available
            for (int i = 0; i < Math.min(4, mFavCheckBoxes.size()); i++) {
                mFavCheckBoxes.get(i).setChecked(true);
            }

        } else {
            TextView lblGeneral = new TextView(this);
            lblGeneral.setText("Ten widżet pobiera rzeczywiste dane telemetryczne bezpośrednio z Twojego serwera NexusPanel.");
            lblGeneral.setTextColor(Color.parseColor("#E2E8F0"));
            lblGeneral.setTextSize(13f);
            lblGeneral.setPadding(0, 10, 0, 10);
            mContainer.addView(lblGeneral);
        }
    }

    private CheckBox createCheckBox(String text, boolean checked) {
        CheckBox cb = new CheckBox(this);
        cb.setText(text);
        cb.setTextColor(Color.parseColor("#F1F5F9"));
        cb.setChecked(checked);
        cb.setPadding(8, 8, 8, 8);
        return cb;
    }

    private void saveAndFinish() {
        JSONObject config = new JSONObject();
        try {
            config.put("widget_type", mWidgetType);

            if ("single_service".equals(mWidgetType) && mServiceSpinner != null) {
                ServiceItem selected = (ServiceItem) mServiceSpinner.getSelectedItem();
                if (selected != null) {
                    config.put("service_id", selected.id);
                    config.put("service_name", selected.name);
                    config.put("service_url", selected.url);
                    config.put("service_ip", selected.ip);
                }
                config.put("show_status", mCbStatus != null && mCbStatus.isChecked());
                config.put("show_ip", mCbIp != null && mCbIp.isChecked());
                config.put("show_uptime", mCbUptime != null && mCbUptime.isChecked());
                config.put("show_latency", mCbLatency != null && mCbLatency.isChecked());

            } else if ("favorite_apps".equals(mWidgetType)) {
                JSONArray ids = new JSONArray();
                for (CheckBox cb : mFavCheckBoxes) {
                    if (cb.isChecked() && cb.getTag() != null) {
                        ids.put(cb.getTag());
                    }
                }
                config.put("service_ids", ids);
            }

            WidgetUpdateHelper.saveWidgetConfig(this, mAppWidgetId, config.toString());

            // Trigger instant update for this widget instance
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(this);
            if ("single_service".equals(mWidgetType)) {
                SingleServiceWidget.updateAppWidget(this, appWidgetManager, mAppWidgetId);
            } else if ("favorite_apps".equals(mWidgetType)) {
                FavoriteAppsWidget.updateAppWidget(this, appWidgetManager, mAppWidgetId);
            } else if ("server_status".equals(mWidgetType)) {
                ServerStatusWidget.updateAppWidget(this, appWidgetManager, mAppWidgetId);
            } else if ("services_status".equals(mWidgetType)) {
                ServicesStatusWidget.updateAppWidget(this, appWidgetManager, mAppWidgetId);
            } else if ("uptime".equals(mWidgetType)) {
                UptimeWidget.updateAppWidget(this, appWidgetManager, mAppWidgetId);
            } else if ("nexus_overview".equals(mWidgetType)) {
                NexusOverviewWidget.updateAppWidget(this, appWidgetManager, mAppWidgetId);
            }

            Intent resultValue = new Intent();
            resultValue.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, mAppWidgetId);
            setResult(RESULT_OK, resultValue);
            finish();

        } catch (Exception e) {
            Toast.makeText(this, "Błąd podczas zapisywania: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }
}
