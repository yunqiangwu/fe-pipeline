docker run --rm -it -p 3306:3306 -v `pwd`/fe-pipeline-home/mysql_data:/var/lib/mysql --name mysql -e MYSQL_ROOT_PASSWORD=root mysql --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci --default_authentication_plugin=mysql_native_password

# docker exec -it mysql mysql -u root -p # type root
# CREATE DATABASE if not exists test DEFAULT CHARACTER SET utf8mb4;
# exit