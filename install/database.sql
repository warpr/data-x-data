

CREATE DATABASE data_x_data;
USE data_x_data;
CREATE USER 'data_x_data'@'localhost' IDENTIFIED BY 'data_x_data';
GRANT ALL ON data_x_data.* TO 'data_x_data'@'localhost';
FLUSH PRIVILEGES;

CREATE TABLE page_views (
       id int NOT NULL AUTO_INCREMENT,
       host VARCHAR(255) NOT NULL,
       screen_size VARCHAR(255) NOT NULL,
       user_agent VARCHAR(255) NOT NULL,
       PRIMARY KEY (id)
) CHARSET=utf8;



