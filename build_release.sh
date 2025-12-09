#!/bin/bash
# Build script for custom FRP binaries (frpc and frps)
# Usage: ./build_release.sh [frpc|frps|all] [linux|darwin] [amd64|arm64]

set -e

# Default values
COMPONENT="${1:-all}"
OS="${2:-linux}"
ARCH="${3:-amd64}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Output directory
OUTPUT_DIR="$SCRIPT_DIR/release"
mkdir -p "$OUTPUT_DIR"

build_frpc() {
    local os=$1
    local arch=$2
    local binary_name="frpc_${os}_${arch}"
    local package_name="frpc_custom_${os}_${arch}"
    
    echo -e "${YELLOW}Building frpc for ${os}/${arch}...${NC}"
    
    GOOS=$os GOARCH=$arch go build -o "$binary_name" ./cmd/frpc/
    
    # Create package directory
    mkdir -p "$package_name"
    cp "$binary_name" "$package_name/frpc"
    cp conf/frpc.toml "$package_name/"
    
    # Create tar.gz
    tar -czvf "$OUTPUT_DIR/${package_name}.tar.gz" "$package_name/"
    
    # Cleanup
    rm -rf "$package_name" "$binary_name"
    
    echo -e "${GREEN}✓ Created: $OUTPUT_DIR/${package_name}.tar.gz${NC}"
}

build_frps() {
    local os=$1
    local arch=$2
    local binary_name="frps_${os}_${arch}"
    local package_name="frps_custom_${os}_${arch}"
    
    echo -e "${YELLOW}Building frps for ${os}/${arch}...${NC}"
    
    GOOS=$os GOARCH=$arch go build -o "$binary_name" ./cmd/frps/
    
    # Create package directory
    mkdir -p "$package_name"
    cp "$binary_name" "$package_name/frps"
    cp conf/frps_dev.toml "$package_name/frps.toml"
    
    # Create tar.gz
    tar -czvf "$OUTPUT_DIR/${package_name}.tar.gz" "$package_name/"
    
    # Cleanup
    rm -rf "$package_name" "$binary_name"
    
    echo -e "${GREEN}✓ Created: $OUTPUT_DIR/${package_name}.tar.gz${NC}"
}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  FRP Custom Build Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Component: $COMPONENT"
echo "OS: $OS"
echo "Arch: $ARCH"
echo ""

case $COMPONENT in
    frpc)
        build_frpc $OS $ARCH
        ;;
    frps)
        build_frps $OS $ARCH
        ;;
    all)
        build_frpc $OS $ARCH
        build_frps $OS $ARCH
        ;;
    *)
        echo -e "${RED}Unknown component: $COMPONENT${NC}"
        echo "Usage: $0 [frpc|frps|all] [linux|darwin] [amd64|arm64]"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Build Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Release packages are in: $OUTPUT_DIR/"
ls -lh "$OUTPUT_DIR/"*.tar.gz 2>/dev/null || echo "No packages found"
