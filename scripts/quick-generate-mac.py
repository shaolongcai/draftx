#!/usr/bin/env python3
# macOS 多架构版本更新信息生成脚本

import hashlib
import os
import base64
import json
import glob
from datetime import datetime

# 从 package.json 读取版本号
def get_version_from_package_json():
    """从 package.json 读取版本号"""
    package_json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'package.json')
    try:
        with open(package_json_path, 'r', encoding='utf-8') as f:
            package_data = json.load(f)
            return package_data.get('version', '1.0.0')
    except Exception as e:
        print(f"⚠️ 读取 package.json 失败: {e}")
        return '1.0.0'

def find_dmg_files():
    """查找所有 DMG 文件并按架构分类"""
    out_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'out')
    dmg_files = {}
    
    if not os.path.exists(out_dir):
        return dmg_files
    
    # 查找所有 DMG 文件，（改为zip文件）
    dmg_pattern = os.path.join(out_dir, "*.zip")
    found_files = glob.glob(dmg_pattern)
    
    for file_path in found_files:
        file_name = os.path.basename(file_path)
        
        # 根据文件名判断架构
        if 'universal' in file_name.lower():
            dmg_files['universal'] = file_path
        elif 'arm64' in file_name.lower():
            dmg_files['arm64'] = file_path
        else:
            # 如果没有明确标识，可能是通用版本或需要手动判断
            dmg_files['x64'] = file_path
    
    return dmg_files

def calculate_file_hash(file_path):
    """计算文件的 SHA512 哈希值"""
    sha512_hash = hashlib.sha512()
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b""):
            sha512_hash.update(chunk)
    return base64.b64encode(sha512_hash.digest()).decode('utf-8')

def generate_yml_content(file_path, version):
    """生成 YAML 内容"""
    sha512 = calculate_file_hash(file_path)
    file_size = os.path.getsize(file_path)
    file_name = os.path.basename(file_path)
    current_time = datetime.utcnow().isoformat() + 'Z'
    
    return f"""version: {version}
files:
  - url: {file_name}
    sha512: {sha512}
    size: {file_size}
path: {file_name}
sha512: {sha512}
releaseDate: '{current_time}'
"""

def generate_mac_update_info():
    """生成 macOS 多架构更新信息"""
    version = get_version_from_package_json()
    dmg_files = find_dmg_files()
    
    if not dmg_files:
        print("❌ 未找到任何 DMG 文件")
        return
    
    print("🍎 macOS 多架构更新信息生成器")
    print("=" * 50)
    print(f"🏷️  版本: {version}")
    print(f"📦 找到 {len(dmg_files)} 个 DMG 文件:")
    
    generated_files = []
    
    for arch, file_path in dmg_files.items():
        print(f"\n🔄 处理 {arch.upper()} 架构...")
        print(f"📁 文件: {os.path.basename(file_path)}")
        
        # 计算哈希值
        print("🔐 计算SHA512...")
        yml_content = generate_yml_content(file_path, version)
        
        # 确定输出文件名
        if arch == 'universal':
            output_file = 'latest-universal.yml'
        elif arch == 'arm64':
            output_file = 'latest-arm64-mac.yml'
        elif arch == 'x64':
            output_file = 'latest-x64-mac.yml'
        else:
            output_file = 'latest-x64-mac.yml'
        
        # 写入文件
        out_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'out')
        output_path = os.path.join(out_dir, output_file)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(yml_content)
        
        file_size = os.path.getsize(file_path)
        print(f"✅ 生成完成: {output_file}")
        print(f"📏 大小: {file_size:,} bytes ({file_size / 1024 / 1024:.1f} MB)")
        
        generated_files.append(output_file)
    
    print("\n" + "=" * 50)
    print("🎉 所有架构的更新信息生成完成!")
    print("📄 生成的文件:")
    for file in generated_files:
        print(f"   - {file}")
    
    # 提供使用建议
    print("\n💡 使用建议:")
    if 'universal' in dmg_files:
        print("   - 推荐使用 Universal Binary 版本 (latest-mac-universal.yml)")
        print("   - 兼容 Intel 和 Apple Silicon Mac")
    else:
        print("   - 根据用户设备架构选择对应的更新文件:")
        if 'arm64' in dmg_files:
            print("     * Apple Silicon Mac: latest-arm64.yml")
        if 'x64' in dmg_files:
            print("     * Intel Mac: latest-x64.yml")

if __name__ == "__main__":
    generate_mac_update_info()