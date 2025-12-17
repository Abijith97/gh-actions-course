FROM ubuntu:22.04

# Install gcc for cross-compiling, make, python3, and pip
RUN apt-get update && \
    apt-get install -y \
    gcc \
    gcc-arm-linux-gnueabi \
    gcc-aarch64-linux-gnu \
    make \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy project files
COPY ../../../simple-c-project/* .

COPY . .

# Build the binary using make
RUN make

# Run main.py with python
ENTRYPOINT ["python3", "main.py"]
