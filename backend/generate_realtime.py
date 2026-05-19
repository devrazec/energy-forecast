#!/usr/bin/env python3
"""
Script to generate realtime energy consumption data at 5-second intervals.
This creates a JSON file with energy readings every 5 seconds.
"""

import json
import os
import random
import math
from datetime import datetime


def generate_realtime_consumption(base_consumption=13.0, duration_minutes=150, variation_range=3.0):
    """
    Generate realtime energy consumption data at 5-second intervals.
    
    Args:
        base_consumption (float): Base energy consumption in MW
        duration_minutes (int): Duration in minutes to generate data for (default: 150 minutes = 2.5 hours)
        variation_range (float): Range of variation around base consumption
    
    Returns:
        dict: Dictionary with timestamps at 5-second intervals
    """
    realtime_data = {}
    
    # Calculate total number of 5-second intervals (including 00:00:00)
    total_intervals = duration_minutes * 12 + 1  # 12 intervals per minute (60/5) + starting point
    
    # Start from 00:00
    current_hour = 0
    current_minute = 0
    current_second = 0
    
    all_timestamps = {}
    
    for i in range(total_intervals):
        # Format timestamp
        timestamp = f"{current_hour:02d}:{current_minute:02d}:{current_second:02d}"
        
        # Generate realistic consumption with slight variation
        if i == 0:
            # First value at 00:00:00 should be exactly base_consumption
            consumption = base_consumption
        else:
            # Use sine wave for smooth transitions + random noise
            wave_offset = math.sin(i / 20) * 1.5  # Smooth wave pattern
            random_noise = random.uniform(-0.3, 0.3)
            consumption = base_consumption + wave_offset + random_noise
            
            # Ensure consumption stays within reasonable bounds
            consumption = max(base_consumption - variation_range, 
                             min(base_consumption + variation_range, consumption))
        
        # Add the data point
        all_timestamps[timestamp] = f"{consumption:.1f}"
        
        # Move to next 5-second mark
        current_second += 5
        if current_second >= 60:
            current_second = 0
            current_minute += 1
            if current_minute >= 60:
                current_minute = 0
                current_hour += 1
    
    # Get current date in DD-MM-YYYY format
    current_date = datetime.now().strftime("%d-%m-%Y")
    
    # Return in the format with date as top-level key
    return {current_date: all_timestamps}


def save_realtime_data(realtime_data, output_path=None):
    """
    Save realtime consumption data to a JSON file.
    
    Args:
        realtime_data (dict): Realtime energy consumption data
        output_path (str): Full path to save the JSON file. If None, uses default path.
    
    Returns:
        str: Path to the saved file
    """
    if output_path is None:
        # Default path
        script_dir = os.path.dirname(os.path.abspath(__file__))
        base_dir = os.path.dirname(script_dir)
        output_dir = os.path.join(base_dir, "frontend/src/app/data/realtime")
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, "realtime.json")
    else:
        # Ensure directory exists
        output_dir = os.path.dirname(output_path)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
    
    # Save to file
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(realtime_data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Generated realtime data: {output_path}")
    return output_path


def main():
    """Generate and save realtime energy consumption data."""
    print("=" * 60)
    print("GENERATING REALTIME ENERGY CONSUMPTION DATA")
    print("=" * 60)
    print()
    
    # Generate realtime data
    # - base_consumption: Base energy level in MW
    # - duration_minutes: How many minutes of data to generate
    # - variation_range: How much the values can vary from base
    print("Generating data at 5-second intervals...")
    realtime_data = generate_realtime_consumption(
        base_consumption=13.0,
        duration_minutes=1440,  # 24 hours of data (1440 minutes)
        variation_range=3.0
    )
    
    # Count how many data points were generated
    total_points = sum(len(v) for v in realtime_data.values())
    print(f"Generated {total_points} data points")
    print()
    
    # Save to default location: frontend/src/app/data/realtime/realtime.json
    output_path = save_realtime_data(realtime_data)
    
    print()
    print("✓ Realtime data generation complete!")
    print(f"  File saved to: {output_path}")
    print()
    print("Sample data (first 10 entries):")
    first_key = list(realtime_data.keys())[0]
    for i, (timestamp, value) in enumerate(realtime_data[first_key].items()):
        if i < 10:
            print(f"  {timestamp}: {value} MW")
    

if __name__ == "__main__":
    main()
