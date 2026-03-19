import pandas as pd

GDP_FILE = 'gdp_pcap.csv'
LIFE_EXP_FILE = 'lex.csv'
POP_FILE = 'pop.csv'
OUTPUT_FILE = 'merged_dataset.csv'

# Standardize country names
COUNTRY_MAPPING = {
    'United States of America': 'United States', 'USA': 'United States', 'US': 'United States',
    'Korea, Rep.': 'South Korea', 'Korea, Democratic People\'s Republic of': 'North Korea',
    'Russian Federation': 'Russia', 'Iran, Islamic Rep.': 'Iran',
    'Egypt, Arab Rep.': 'Egypt', 'Venezuela, RB': 'Venezuela',
    'Syrian Arab Republic': 'Syria', 'Lao PDR': 'Laos',
    'Congo, Dem. Rep.': 'Democratic Republic of Congo',
    'Congo, Rep.': 'Republic of Congo', 'Yemen, Rep.': 'Yemen',
    'Türkiye': 'Turkey', 'Czechia': 'Czech Republic',
    'Slovak Republic': 'Slovakia', 'Viet Nam': 'Vietnam',
    'Myanmar (Burma)': 'Myanmar',
}

def standardize_country_name(country):
    if pd.isna(country):
        return None
    country = str(country).strip()
    return COUNTRY_MAPPING.get(country, country)

def load_gdp():
    print("\nLoading GDP Data...")
    gdp_df = pd.read_csv(GDP_FILE)
    gdp_df['name'] = gdp_df['name'].apply(standardize_country_name)
    print(f"Loaded {len(gdp_df)} GDP Rows.")
    return gdp_df

def load_life_expectancy():
    print("\nLoading Life Expectancy Data.....")
    life_exp_df = pd.read_csv(LIFE_EXP_FILE)
    life_exp_df['name'] = life_exp_df['name'].apply(standardize_country_name)
    print(f"Loaded {len(life_exp_df)} Life Expectancy Rows.")
    return life_exp_df

def load_population():
    print("\nLoading Population Data.....")
    pop_df = pd.read_csv(POP_FILE)
    pop_df['name'] = pop_df['name'].apply(standardize_country_name)
    print(f"Loaded {len(pop_df)} Population Rows.")
    return pop_df

def merge_datasets():
    print("\nMerging Datasets...")
    gdp_df = load_gdp()
    life_exp_df = load_life_expectancy()
    population_df = load_population()
    
    # Get all unique countries and sort them alphabetically
    all_countries = sorted(set(gdp_df['name'].dropna()) | set(life_exp_df['name'].dropna()) | set(population_df['name'].dropna()))
    
    # Get all year columns (numeric columns)
    gdp_years = [col for col in gdp_df.columns if col not in ['name', 'geo'] and str(col).isdigit()]
    life_years = [col for col in life_exp_df.columns if col not in ['name', 'geo'] and str(col).isdigit()]
    pop_years = [col for col in population_df.columns if col not in ['name', 'geo'] and str(col).isdigit()]
    all_years = sorted(set(gdp_years + life_years + pop_years))
    
    # Create merged dataset
    merged_data = []
    for country in all_countries:
        gdp_row = gdp_df[gdp_df['name'] == country].iloc[0] if len(gdp_df[gdp_df['name'] == country]) > 0 else None
        life_row = life_exp_df[life_exp_df['name'] == country].iloc[0] if len(life_exp_df[life_exp_df['name'] == country]) > 0 else None
        pop_row = population_df[population_df['name'] == country].iloc[0] if len(population_df[population_df['name'] == country]) > 0 else None
        
        geo = None
        if gdp_row is not None and 'geo' in gdp_row:
            geo = gdp_row['geo']
        elif life_row is not None and 'geo' in life_row:
            geo = life_row['geo']
        elif pop_row is not None and 'geo' in pop_row:
            geo = pop_row['geo']
        
        for year in all_years:
            year_str = str(year)
            gdp_val = None
            life_val = None
            pop_val = None
            
            if gdp_row is not None and year_str in gdp_row:
                try:
                    gdp_val = float(gdp_row[year_str]) if pd.notna(gdp_row[year_str]) else None
                except:
                    gdp_val = None
            
            if life_row is not None and year_str in life_row:
                try:
                    life_val = float(life_row[year_str]) if pd.notna(life_row[year_str]) else None
                except:
                    life_val = None
            
            if pop_row is not None and year_str in pop_row:
                try:
                    pop_val = float(pop_row[year_str]) if pd.notna(pop_row[year_str]) else None
                except:
                    pop_val = None
            
            # Only add if at least one value exists
            if gdp_val is not None or life_val is not None or pop_val is not None:
                merged_data.append({
                    'name': country,
                    'geo': geo,
                    'year': int(year),
                    'gdp': gdp_val,
                    'lifeExp': life_val,
                    'pop': pop_val
                })
    
    fused_df = pd.DataFrame(merged_data)
    # Sort by country name, then by year to ensure consistent ordering
    fused_df = fused_df.sort_values(['name', 'year']).reset_index(drop=True)
    print(f"Merged Dataset: {len(fused_df)} Rows.")
    return fused_df

def save_to_csv(csv_df):
    print("\nSaving Merged Dataset to CSV.....")
    try:
        csv_df.to_csv(OUTPUT_FILE, index=False)
        print(f"Saved {len(csv_df)} Rows to '{OUTPUT_FILE}'.")
    except Exception as e:
        print(f"Error saving file: {e}")

# Main function
if __name__ == "__main__":
    print("=" * 60)
    print("MERGING GDP, LIFE EXPECTANCY, AND POPULATION DATA")
    print("=" * 60)
    merged_df = merge_datasets()
    save_to_csv(merged_df)
    print("\nSample Data (First 50 rows):")
    print(merged_df.head(50))
    print("\nColumns in Merged Dataset:")
    print(merged_df.columns.tolist())
    print(merged_df.head(50))
    print(merged_df.count)
    print("\nFusion Process Complete!")

