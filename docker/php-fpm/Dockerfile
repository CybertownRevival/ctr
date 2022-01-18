FROM php:7.2-fpm


RUN apt-get update && apt-get install -y libpng-dev libjpeg-dev libfreetype6-dev
RUN docker-php-ext-configure gd --with-freetype-dir=/usr/include/ --with-jpeg-dir=/usr/include/
RUN docker-php-ext-install pdo_mysql mysqli gd exif
