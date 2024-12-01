import pandas as pd
import numpy as np
import re

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


def polyMean(raw: list[list[list]]):
    parsed = []
    for polySection in raw:
        # Take the mean of its x and y coordinates
        sums = np.add.reduce(polySection, axis=0)
        sums /= len(polySection)
        parsed.append(sums.tolist())

    return parsed        
        

def main(year: int):
    df = pd.read_csv(rf"C:\Users\hayde\Documents\UNCC-Work-Local\ITCS-6121\VisFInalProject\data\raw\warn-{year}.csv")
    
    df["WARNINGTYPE"] = df["WARNINGTYPE"].apply(parseWarning)
    df["POLYGON"] = df["POLYGON"].apply(parsePolygon)
    df["MEAN"] = df["POLYGON"].apply(polyMean)

    print(df["WARNINGTYPE"].unique())

    df.to_csv(
        rf"C:\Users\hayde\Documents\UNCC-Work-Local\ITCS-6121\VisFInalProject\data\warn-{year}-parsed.csv",
        index=False,
        columns=["EXPIREDATE", "ISSUEDATE", "WARNINGTYPE", "POLYGON", "MEAN"]
    )


if __name__ == "__main__":
    for i in range(2001, 2017):
        main(i)
        