
CREATE EXTENSION btree_gist;

CREATE TABLE page_views (
    host VARCHAR(255) NOT NULL,
    user_agent TEXT NOT NULL,
    x INTEGER,
    y INTEGER,
    sum INTEGER DEFAULT 1,
    interval_start timestamptz NOT NULL,
    interval_end timestamptz NOT NULL,
    CHECK( interval_start < interval_end ),
    CONSTRAINT page_views_overlap EXCLUDE USING gist(
        host WITH =,
        user_agent WITH =,
        x WITH =,
        y WITH =,
        box(
          point(
              extract(epoch FROM interval_start at time zone 'UTC'),
              extract(epoch FROM interval_start at time zone 'UTC')
          ),
          point(
              extract(epoch FROM interval_end at time zone 'UTC') - 1,
              extract(epoch FROM interval_end at time zone 'UTC') - 1
          )
        ) WITH &&));

CREATE ROLE data_x_data LOGIN PASSWORD 'data_x_data';
GRANT ALL PRIVILEGES ON page_views TO data_x_data;
