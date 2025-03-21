## Lệnh docker

### Thông tin docker

```bash
docker version
```

### Show các image

```bash
docker image ls
```

### Xóa image

```bash
docker image rm HASH
```

### Show các container đang chạy (thêm `-a` để show luôn bị dừng)

```bash
docker container ls
# hoặc cái này cũng được
docker ps
```

### Dừng container

```bash
docker container stop HASH
```

### Xóa container

```bash
docker container rm HASH
```

### Build Image từ `Dockerfile`. `thupha/nodejs:v2` là tên image, đặt tên theo cú pháp `USERNAME/TÊN_IMAGE:TAG`

```bash
docker build --progress=plain -t thupha/nodejs:v2 -f Dockerfile.dev .
```

Nếu muốn chỉ định file `Dockerfile` nào đó thì thêm `-f` và đường dẫn tới file đó.

Thi thoảng sẽ có thể gặp lỗi do cache, vậy thì thêm `--no-cache` vào

```bash
docker build --progress=plain -t dev/shoplaz:v0 -f Dockerfile.dev .
```

### Tạo và chạy container dựa trên image

```bash
docker container run -dp PORT_NGOAI:PORT_TRONG_DOCKER TEN_IMAGE "Tên image"
```

ví dụ

```bash
docker container run -dp 4000:4000 dev/shoplaz:v0
```

Nếu muốn mapping folder trong container và folder ở ngoài thì thêm `-v`. Cái này gọi là volume.

```bash
docker container run -dp 4000:4000 -v ABSOLUTE_PATH/uploads:/app/uploads dev/shoplaz:v0
```

### Show log của container

```bash
docker logs -f HASH_CONTAINER
```

### Truy cập vào terminal của container

```bash
docker exec -it HASH_CONTAINER sh
```

Muốn thoát ra thì gõ `exit`

### Để chạy các câu lệnh trong `docker-compose.yml` thì dùng lệnh. Đôi khi cache lỗi thì thêm `--force-recreate --build`

```bash
docker-compose up
```

## Lệnh khác

Dừng và xóa hết tất cả container đang chạy

```bash
docker stop $(docker ps -aq) && docker rm $(docker ps -aq)
```

Thêm chế độ tự động khởi động lại container khi reboot server. Trong trường hợp đã có container từ trước thì dùng

```bash
docker update --restart unless-stopped HASH_CONTAINER
```

Còn chưa có container thì thêm vào câu lệnh `docker run` option là `--restart unless-stopped`

```bash
docker run -dp 4000:4000 --name shoplaz-api --restart unless-stopped -v ~/shoplaz-api/uploads:/app/uploads thupha/shoplaz:v4
```
