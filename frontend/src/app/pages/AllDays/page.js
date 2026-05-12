"use client";

import React, { useState, useContext, useMemo, useEffect } from "react";
import { GlobalContext } from "../../context/GlobalContext";
import Layout from "../../components/Layout";
import ReactECharts from "echarts-for-react";

// Import all city data
import lisbonData from "../../data/consumption/lisbon.json";
import portoData from "../../data/consumption/porto.json";
import faroData from "../../data/consumption/faro.json";
import coimbraData from "../../data/consumption/coimbra.json";
import bragaData from "../../data/consumption/braga.json";
import bragancaData from "../../data/consumption/bragança.json";
import leiriaData from "../../data/consumption/leiria.json";
import guardaData from "../../data/consumption/guarda.json";

const cityDataMap = {
  Lisbon: lisbonData,
  Porto: portoData,
  Faro: faroData,
  Coimbra: coimbraData,
  Braga: bragaData,
  Bragança: bragancaData,
  Leiria: leiriaData,
  Guarda: guardaData,
};

export default function AllDaysPage() {
  const {
    darkMode,
    setDarkMode,
    mobileDevice,
    setMobileDevice,
  } = useContext(GlobalContext);

  // Get all available days from the first city
  const availableDays = Object.keys(lisbonData.Lisbon).sort();
  const [selectedDay, setSelectedDay] = useState(availableDays[0]);

  const chartOption = useMemo(() => {
    const isMobile = !!mobileDevice;

    // Get all hours for the selected day from the first city
    const firstCityData = Object.values(cityDataMap)[0];
    const firstCityName = Object.keys(firstCityData)[0];
    const dayData = firstCityData[firstCityName][selectedDay];
    
    if (!dayData) {
      return {};
    }

    const allHours = Object.keys(dayData).sort();

    // Create series for each city with different colors
    const colors = [
      { color: "#0ea5e9", rgba: "14, 165, 233" }, // sky blue
      { color: "#10b981", rgba: "16, 185, 129" }, // green
      { color: "#f59e0b", rgba: "245, 158, 11" }, // amber
      { color: "#ef4444", rgba: "239, 68, 68" }, // red
      { color: "#8b5cf6", rgba: "139, 92, 246" }, // purple
      { color: "#ec4899", rgba: "236, 72, 153" }, // pink
      { color: "#06b6d4", rgba: "6, 182, 212" }, // cyan
      { color: "#14b8a6", rgba: "20, 184, 166" }, // teal
    ];

    const cities = Object.keys(cityDataMap);

    // Create markLine data for hour labels (every hour)
    const hourMarkLines = allHours.map((hour) => ({
      name: hour,
      xAxis: hour,
      lineStyle: {
        color: darkMode ? "#4b5563" : "#cbd5e1",
        width: 1,
        type: "solid",
      },
      label: {
        show: true,
        formatter: "{b}",
        position: "insideEndTop",
        color: darkMode ? "#9ca3af" : "#94a3b8",
        fontSize: 10,
        fontWeight: 600,
      },
    }));

    const series = cities.map((cityName, index) => {
      const cityData = cityDataMap[cityName];
      const cityConsumptionData = cityData[cityName][selectedDay];
      const colorInfo = colors[index % colors.length];

      // Map hours to consumption values
      const data = allHours.map((hour) => {
        const consumptionStr = cityConsumptionData?.[hour];
        return consumptionStr ? parseFloat(consumptionStr) : null;
      });

      const seriesConfig = {
        name: cityName,
        type: "line",
        data: data,
        smooth: true,
        showSymbol: false,
        color: colorInfo.color,
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `rgba(${colorInfo.rgba}, 0.3)` },
              { offset: 1, color: `rgba(${colorInfo.rgba}, 0.01)` },
            ],
          },
        },
        connectNulls: true,
        markPoint: {
          data: [
            {
              type: "max",
              name: "Max",
              label: { formatter: (p) => p.value.toFixed(1) },
            },
            {
              type: "min",
              name: "Min",
              label: { formatter: (p) => p.value.toFixed(1) },
            },
          ],
          symbol: "pin",
          symbolSize: 50,
          label: { fontSize: 8 },
        },
      };

      // Add markLine only to the first series to avoid duplicate labels
      if (index === 0) {
        seriesConfig.markLine = {
          symbol: "none",
          data: hourMarkLines,
        };
      }

      return seriesConfig;
    });

    return {
      backgroundColor: "transparent",
      title: {
        text: `Energy Consumption - ${new Date(selectedDay).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
        left: "center",
        textStyle: {
          color: darkMode ? "#fff" : "#000",
          fontSize: 18,
          fontWeight: 600,
        },
      },
      tooltip: {
        trigger: "axis",
        position: (pt) => [pt[0], "10%"],
        formatter: (params) => {
          let result = `Hour: ${params[0].axisValue}<br/>`;
          params.forEach((param) => {
            if (param.value !== null && param.value !== undefined) {
              result += `${param.marker}${param.seriesName}: ${param.value.toFixed(1)} MW<br/>`;
            }
          });
          return result;
        },
        backgroundColor: darkMode ? "#1f2937" : "#fff",
        borderColor: darkMode ? "#374151" : "#ccc",
        textStyle: { color: darkMode ? "#d1d5db" : "#333" },
      },
      legend: {
        data: cities,
        orient: "vertical",
        top: "middle",
        right: 0,
        textStyle: { color: darkMode ? "#d1d5db" : "#333" },
      },
      grid: isMobile
        ? { left: 10, right: 10, bottom: 100, top: 60, containLabel: true }
        : { left: 50, right: 100, bottom: 80, top: 60, containLabel: false },
      toolbox: {
        top: 10,
        feature: {
          dataZoom: { yAxisIndex: "none" },
          magicType: { type: ["line", "bar"] },
          saveAsImage: {},
        },
      },
      xAxis: {
        type: "category",
        data: allHours,
        boundaryGap: false,
        name: "Hour",
        nameLocation: "middle",
        nameGap: 25,
        nameTextStyle: { color: darkMode ? "#9ca3af" : "#666" },
        axisLabel: {
          formatter: "{value}",
          color: darkMode ? "#9ca3af" : "#666",
        },
        axisLine: { lineStyle: { color: darkMode ? "#374151" : "#ccc" } },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        name: "Energy Consumption (MW)",
        nameTextStyle: { color: darkMode ? "#9ca3af" : "#666" },
        min: 8,
        max: 19,
        boundaryGap: [0, "20%"],
        axisLabel: {
          formatter: (val) => val.toFixed(1) + " MW",
          color: darkMode ? "#9ca3af" : "#666",
        },
        splitLine: { lineStyle: { color: darkMode ? "#374151" : "#f0f0f0" } },
      },
      dataZoom: [
        { type: "inside", start: 0, end: 80 },
        {
          type: "slider",
          start: 0,
          end: 100,
          textStyle: { color: darkMode ? "#9ca3af" : "#666" },
          borderColor: darkMode ? "#374151" : "#ccc",
          fillerColor: darkMode ? "rgba(55,65,81,0.5)" : "rgba(0,139,193,0.1)",
          backgroundColor: darkMode ? "#1f2937" : "#f8f8f8",
        },
      ],
      series: series,
    };
  }, [selectedDay, darkMode, mobileDevice]);

  return (
    <Layout>
      <div
        style={{
          padding: "24px 24px 24px 24px",
          overflowY: "auto",
          height: "100%",
          background: darkMode ? "#111827" : undefined,
        }}
      >
        {/* Day Selector */}
        <div
          style={{
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <label
            htmlFor="day-select"
            style={{
              color: darkMode ? "#d1d5db" : "#374151",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            Select Day:
          </label>
          <select
            id="day-select"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: `1px solid ${darkMode ? "#374151" : "#d1d5db"}`,
              background: darkMode ? "#1f2937" : "#fff",
              color: darkMode ? "#d1d5db" : "#374151",
              fontSize: "14px",
              cursor: "pointer",
              outline: "none",
            }}
          >
            {availableDays.map((day) => (
              <option key={day} value={day}>
                {new Date(day).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            background: darkMode ? "#1f2937" : "#fff",
            border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
            borderRadius: 10,
            padding: "16px 20px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            width: "100%",
            height: "calc(100% - 60px)",
          }}
        >
          <div style={{ touchAction: "none", height: "100%" }}>
            <ReactECharts
              option={chartOption}
              style={{ height: "100%", width: "100%" }}
              opts={{ renderer: "canvas" }}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
