import pandas as pd
import re

df = pd.read_csv(r"C:\Users\hayde\Documents\UNCC-Work-Local\ITCS-6121\VisFInalProject\data\raw\warn-2001.csv")
"""
Polygon should parse into this structure:

[ (outer list defines the whole polygon with all its parts)
    [ (inner lists define each part of the polygon (typically only one))
        [longitude, latitude] (coordinate),
        [longitude, latitude],
        [longitude, latitude],
        [longitude, latitude],
        ...
    ]
]
"""
def parsePolygon(raw: str):
    parsed = []
    
    # Pull coordinate groups out of polygon
    matches = re.finditer(r"\([\.\-\d ]+\)", raw)
    for poly in matches:
        # For each polygon defined, split its coordinates and place in list
        sliced = poly.group()[1:-1].split(" ")
        part = []
        
        for i in range(len(sliced)):
            if (i % 2) == 0:
                part.append([
                    float(sliced[i]), 
                    float(sliced[i + 1])
                ])

        parsed.append(part)

    return parsed


def parseWarning(raw: str):
    # Lowercase and separate by hyphen
    lower = raw.lower().split(" ")
    return "-".join(lower)


df["POLYGON"] = df["POLYGON"].apply(parsePolygon)
df["WARNINGTYPE"] = df["WARNINGTYPE"].apply(parseWarning)

print(df["WARNINGTYPE"].unique())

df.to_csv(
    r"C:\Users\hayde\Documents\UNCC-Work-Local\ITCS-6121\VisFInalProject\data\raw\warn-2001-parsed.csv",
    index=False,
    columns=["EXPIREDATE", "ISSUEDATE", "WARNINGTYPE", "POLYGON"]
)
