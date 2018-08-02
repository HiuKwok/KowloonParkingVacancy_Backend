CREATE TABLE carpark (
    id integer,
    name_en varchar(200),
    name_zh varchar(200),
    name_cn varchar(200),
    longitude float,
    latitude float
);


CREATE TABLE vacancy (
    id integer,
    ts timestamp,
    available integer,
    cartype varchar(50)
);