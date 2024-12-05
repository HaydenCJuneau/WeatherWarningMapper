import pandas as pd
import numpy as np
import re

exportCols = ["EXPIREDATE", "ISSUEDATE", "WARNINGTYPE", "POLYGON", "MEAN"]

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


def main():
    # Holds 12 dataframes representing each month
    months = [pd.DataFrame(columns=[]) for _ in range(12)]

    total = 0
    
    for year in range(2001, 2017):
        df = pd.read_csv(rf"C:\Users\hayde\Documents\UNCC-Work-Local\ITCS-6121\VisFInalProject\data\raw\warn-{year}.csv")
        
        df["WARNINGTYPE"] = df["WARNINGTYPE"].apply(parseWarning)
        df["POLYGON"] = df["POLYGON"].apply(parsePolygon)
        df["MEAN"] = df["POLYGON"].apply(polyMean)

        for i, mdf in enumerate(months):
            selector = df["ISSUEDATE"].str[5:7].astype(int) == i + 1
            monthRows = df.loc[selector]
            months[i] = pd.concat([mdf, monthRows], ignore_index=True, sort=False)

        total += len(df.index)
        del df # Free Memory Taken by DataFrame

    mtotal = 0
    for i, mdf in enumerate(months):
        print(mdf["WARNINGTYPE"].unique())
        mtotal += len(mdf.index)

        mdf.to_csv(
            rf"C:\Users\hayde\Documents\UNCC-Work-Local\ITCS-6121\VisFInalProject\data\monthly\warn-month-{i + 1}.csv",
            index=False,
            columns=["EXPIREDATE", "ISSUEDATE", "WARNINGTYPE", "POLYGON", "MEAN"]
        )

    # For testing. Check that no data was lost
    print(f"dft: {total}, mdft: {mtotal}, same: {total == mtotal}")


if __name__ == "__main__":
    main()
        