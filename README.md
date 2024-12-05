# Hayden Juneau's Severe Weather Mapper
Created for ITCS 6121 - Data and Information Visualization

## Abstract
This application is a small data visualization tool utilizing aggregated severe weather warning data. Use it to view actual issues warnings for each month, summed up from 2001 - 2016. View four types of weather risks: Tornado, Severe Thunderstorm, Flood and Marine. The "Boxes" view shows polygons encompassing the affected areas. The "Heatmap" view generates a hexagonal map of warnings for each type. More intense colors signify a more heavily affected area. Gain insights about areas with more intense weather, and how those areas shift over the course of a year.

## Introduction & DataSets
This application arose out of a drive to answer three questions:
1. What severe weather types are most widespread?
1. Which areas of the US experience the most of each severe weather type?
1. What times of the year does severe weather impact the US the most?

The NOAA has great resources for aggregated weather data. The SWDI itself has over 10GB (compressed) of csv files. They hold data ranging from mesocyclones, to hail to hurricane tracks. Attempting to visualize all this data would likely prove to introduce too much noise. It was best to attack these questions through one set. The issued warnings were a good choice, since Charlotte, North Carolina residents are very familiar with 3 out of the four types. The hope was not only to understand Charlotte's weather risk more closely, but also its relativity to the rest of the country.

![Tornado Warnings in July](/images/tornado-boxes-july.png)<br>
*Tornado Warnings in July (2001-2016)*

## Design
Because all of the data was focused on the continental United States, a GeoAlbertson projection was used. Polygon data for state borders are generated from a GeoJson file. State lines seemed to be a good fit (as opposed to county or road-based maps) because the focus was on geographic regions of the US, not on particular cities/rural areas.<br>

Colors correspond to warning types in a similar way to typical weather radar applications. These colors have good contract between them, but also form a strong association with what a user might be used to seeing. Luckily, D3 provides heatmap color scales which align very closely with the selected colors. The combined heatmap uses a blue/white scheme, since that scheme is not used elsewhere in the program. Finding a proper color scaling function proved difficult. Most data lies within the midrange of 0 - maximum, meaning mid and small range value differences should be accentuated more than large values. Using an exponential scale proved to highlight this effectively.

![Severe Thunderstorm Heatmap in July](/images/severe-thunderstorm-heatmap-july.png)<br>
*Severe Thunderstorm Hexagonal Heatmap (July)*

## Data Processing
Although the goal of this assignment was to have all design be in D3, some pre-processing had to be done to the dataset. The raw data comes in a format best suited for excel. Especially the polygon column, which would need to be heavily parsed on the frontend each time the application read it. Additionally, mean locations (for the heatmap) only needed to be computed once, so recalculating it every time would have been wasteful. Finally, not all columns in the raw data would be useful for the application. Some cleaning was necessary, but not so much that D3 wasn't doing any heavy lifting<br>

A simple Python script was created to give the data a good cleaning and formatting. This proved to be simpler than expected, due to heavy use of the Pandas library. The script parses out the POLYGON data into a format better suited for javascript. It calculates the mean coordinate for each polygon. It then sorts the raw data into monthly sets. After this point, all drawing and coloring is done by D3.

![Mean Locations in Tornado Warning Boxes](/images/tornado-centers.png)<br>
*Mean Locations (Blue Dots) for Tornado Warnings*

## Results / Findings
Going back to the questions posed at the beginning of the project, what can be learned?
1. What severe weather types are most widespread?
    - Severe Thunderstorms are definitely the most widespread risk in this set. This makes sense, considering that severe thunderstorms are really the least severe risk in this data. They can be issued and pass over an area without causing much damage. Even a storm with winds only strong enough to knock over deck chairs would be considered. Therefore, they're less of an anomaly and occur more, and in more areas.
1. Which areas of the US experience the most of each severe weather type?
    - The Gulf South, Great Plains, and East Coast. At least, they do when only considering these types of risk. A drawback of the map is that no heat warnings, or earthquake warnings are reported. In this case, the West Coast might appear to be at equal risk.
1. What times of the year does severe weather impact the US the most?
    - April - August. Again, bias is likely being shown here, since the weather risks in this dataset are all results of heat in the ocean and atmosphere. It would be interesting to add winter-related risks to this dataset.

![Combined Warning Heamap for July](/images/combined-heatmap-july.png)<br>
*Combined Warnings in a Heatmap (July)*

## Conclusion
If you limit your scope to just the four warnings in this demo, you can extract a lot of insights about how they affect the country. It shows interesting patterns, like how the Tornado Alley 'creeps' from the gulf to the Midwest as Summer approaches. It shows dense pockets of thunderstorms and flooding across the east coast, and how it tends to follow along the Appalachians. You can see how hurricane-prone coastlines are subject to more marine warnings in late Summer.<br>
However, you cannot see the cost for these storms. Sure, the east coat may appear to get as many severe storms as the Gulf states, but what does FEMA funding show about where actual damage is located? These questions would be great to continue exploring.<br>
Additionally, more warning types would give a more even risk coverage across the US. Specifically the addition of excessive heat and winter storm warnings. That would likely divert more attention to the Rust Belt and Desert areas.