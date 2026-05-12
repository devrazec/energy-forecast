import json
import os
from datetime import datetime, timedelta
import random
import pandas as pd
import numpy as np


def generate_energy_consumption(cities, start_date, num_days=7):
    """
    Generate energy consumption data for multiple cities.
    
    Args:
        cities (list): List of city names
        start_date (str): Start date in format 'YYYY-MM-DD'
        num_days (int): Number of consecutive days to generate data for
    
    Returns:
        dict: Dictionary with city names as keys and their consumption data
    """
    start = datetime.strptime(start_date, "%Y-%m-%d")
    
    # Base consumption patterns (MW) - varies by city size
    city_base_consumption = {
        "Lisbon": 15.0,     # Largest city
        "Porto": 14.0,      # Second largest
        "Faro": 12.5,
        "Coimbra": 13.0,
        "Braga": 13.5,
        "Bragança": 11.5,   # Smaller city
        "Leiria": 12.0,
        "Guarda": 11.8
    }
    
    all_cities_data = {}
    
    for city in cities:
        base_consumption = city_base_consumption.get(city, 13.0)
        city_data = {}
        
        for day in range(num_days):
            current_date = start + timedelta(days=day)
            date_str = current_date.strftime("%Y-%m-%d")
            daily_data = {}
            
            for hour in range(24):
                time_str = f"{hour:02d}:00"
                
                # Generate realistic consumption pattern
                # Lower at night (0-6), increase during day (7-19), decrease at night (20-23)
                if 0 <= hour < 6:
                    # Night time - lower consumption
                    consumption = base_consumption - (2.0 + random.uniform(-0.5, 0.5))
                elif 6 <= hour < 9:
                    # Morning rise
                    consumption = base_consumption - (1.0 - (hour - 6) * 0.3) + random.uniform(-0.3, 0.3)
                elif 9 <= hour < 12:
                    # Mid-morning peak
                    consumption = base_consumption + (1.5 + random.uniform(-0.4, 0.4))
                elif 12 <= hour < 15:
                    # Afternoon peak
                    consumption = base_consumption + (2.0 + random.uniform(-0.5, 0.5))
                elif 15 <= hour < 19:
                    # Evening
                    consumption = base_consumption + (1.0 + random.uniform(-0.3, 0.3))
                elif 19 <= hour < 22:
                    # Late evening
                    consumption = base_consumption + (0.5 + random.uniform(-0.3, 0.3))
                else:
                    # Night
                    consumption = base_consumption - (1.5 + random.uniform(-0.4, 0.4))
                
                # Add some day-to-day variation
                day_variation = random.uniform(-0.3, 0.3)
                consumption += day_variation
                
                # Format to one decimal place
                daily_data[time_str] = f"{consumption:.1f}"
            
            city_data[date_str] = daily_data
        
        all_cities_data[city] = city_data
    
    return all_cities_data


def save_city_data_to_json(city_name, city_data, output_dir="data"):
    """
    Save a single city's data to a JSON file.
    
    Args:
        city_name (str): Name of the city
        city_data (dict): Energy consumption data for the city
        output_dir (str): Directory to save JSON files
    """
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Create JSON structure with city name as root key
    json_data = {city_name: city_data}
    
    # Save to file
    filename = os.path.join(output_dir, f"{city_name.lower()}.json")
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(json_data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Generated {filename}")


def predict_next_day_consumption(city_name, json_file_path):
    """
    Predict energy consumption for the next day based on the last 7 days using pandas.
    
    Args:
        city_name (str): Name of the city
        json_file_path (str): Path to the city's JSON file with historical data
    
    Returns:
        dict: Predicted consumption data for the next day
    """
    # Load the JSON data
    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    city_data = data[city_name]
    
    # Convert to pandas DataFrame
    rows = []
    for date, hourly_data in city_data.items():
        for hour, consumption in hourly_data.items():
            rows.append({
                'date': date,
                'hour': hour,
                'consumption': float(consumption)
            })
    
    df = pd.DataFrame(rows)
    df['datetime'] = pd.to_datetime(df['date'] + ' ' + df['hour'])
    df = df.sort_values('datetime')
    
    # Get the last date in the dataset
    last_date = pd.to_datetime(df['date'].max())
    next_date = last_date + timedelta(days=1)
    next_date_str = next_date.strftime("%Y-%m-%d")
    
    # Calculate predictions for each hour
    predicted_day = {}
    
    for hour in range(24):
        hour_str = f"{hour:02d}:00"
        
        # Get historical data for this specific hour across all days
        hour_data = df[df['hour'] == hour_str]['consumption'].values
        
        if len(hour_data) > 0:
            # Method 1: Weighted average (more recent days have higher weight)
            weights = np.arange(1, len(hour_data) + 1)
            weighted_avg = np.average(hour_data, weights=weights)
            
            # Method 2: Calculate trend (linear regression on last 7 days)
            if len(hour_data) >= 3:
                x = np.arange(len(hour_data))
                # Simple linear trend calculation
                trend = np.polyfit(x, hour_data, 1)[0]
                # Predict next value considering trend
                trend_prediction = hour_data[-1] + trend
            else:
                trend_prediction = weighted_avg
            
            # Combine both methods (70% weighted average, 30% trend)
            predicted_value = 0.7 * weighted_avg + 0.3 * trend_prediction
            
            # Add some realistic variation but keep it reasonable
            variation = np.random.uniform(-0.2, 0.2)
            predicted_value += variation
            
            # Ensure the predicted value is within reasonable bounds
            min_consumption = hour_data.min() * 0.9
            max_consumption = hour_data.max() * 1.1
            predicted_value = np.clip(predicted_value, min_consumption, max_consumption)
            
            predicted_day[hour_str] = f"{predicted_value:.1f}"
        else:
            # Fallback: use average of all available data for that hour
            predicted_day[hour_str] = "13.0"
    
    return {
        'city': city_name,
        'prediction_date': next_date_str,
        'predicted_consumption': predicted_day,
        'based_on_days': len(df['date'].unique())
    }


def save_prediction_to_json(prediction_data, output_dir="data/predictions"):
    """
    Save prediction data to a JSON file.
    
    Args:
        prediction_data (dict): Prediction data including city, date, and consumption
        output_dir (str): Directory to save prediction files
    """
    os.makedirs(output_dir, exist_ok=True)
    
    city_name = prediction_data['city']
    prediction_date = prediction_data['prediction_date']
    
    # Create JSON structure
    json_data = {
        city_name: {
            prediction_date: prediction_data['predicted_consumption']
        }
    }
    
    filename = os.path.join(output_dir, f"{city_name.lower()}.json")
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(json_data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Predicted {city_name} for {prediction_date}: {filename}")
    return filename


def predict_all_cities(data_dir="../frontend/src/app/data/consumption", 
                       output_dir="../frontend/src/app/data/forecast/pandas"):
    """
    Generate predictions for all cities based on their historical data.
    
    Args:
        data_dir (str): Directory containing historical consumption data
        output_dir (str): Directory to save prediction files
    """
    cities = [
        "Lisbon",
        "Porto",
        "Faro",
        "Coimbra",
        "Braga",
        "Bragança",
        "Leiria",
        "Guarda"
    ]
    
    print("Generating predictions for all cities...")
    print()
    
    predictions = []
    for city in cities:
        json_file = os.path.join(data_dir, f"{city.lower()}.json")
        
        if os.path.exists(json_file):
            prediction = predict_next_day_consumption(city, json_file)
            save_prediction_to_json(prediction, output_dir)
            predictions.append(prediction)
        else:
            print(f"✗ Warning: {json_file} not found")
    
    print()
    print(f"✓ Successfully generated {len(predictions)} predictions")
    
    return predictions


def main():
    """Main function to generate energy consumption data for all cities."""
    cities = [
        "Lisbon",
        "Porto",
        "Faro",
        "Coimbra",
        "Braga",
        "Bragança",
        "Leiria",
        "Guarda"
    ]
    
    # Generate data starting from 2026-05-10 for 7 consecutive days
    start_date = "2026-05-10"
    num_days = 7
    
    # Output directory for JSON files
    output_dir = "../frontend/src/app/data/consumption"
    
    print(f"Generating energy consumption data for {len(cities)} cities...")
    print(f"Period: {start_date} to {(datetime.strptime(start_date, '%Y-%m-%d') + timedelta(days=num_days-1)).strftime('%Y-%m-%d')}")
    print()
    
    # Generate all data
    #all_cities_data = generate_energy_consumption(cities, start_date, num_days)
    
    # Save each city's data to a separate JSON file
    #for city, city_data in all_cities_data.items():
    #    save_city_data_to_json(city, city_data, output_dir)
    
    print()
    print(f"✓ Successfully generated {len(cities)} JSON files in '{output_dir}'")
    
    # Generate predictions for the next day
    print()
    print("=" * 60)
    print("GENERATING PREDICTIONS FOR NEXT DAY")
    print("=" * 60)
    print()
    
    predict_all_cities(output_dir)


if __name__ == "__main__":
    main()
