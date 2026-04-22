# Gunakan image PHP resmi dengan Apache
FROM php:8.2-apache

# Aktifkan mod_rewrite agar URL bersih (.htaccess) bisa jalan
RUN a2enmod rewrite

# Setel direktori kerja di container
WORKDIR /var/www/html

# Copy semua file backend ke dalam container
COPY . .

# (Opsional) Ubah izin file biar aman
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage