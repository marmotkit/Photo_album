<template>
  <div class="app-container">
    <!-- 左側導航樹 -->
    <div class="nav-tree">
      <div class="tree-header">
        <i class="fas fa-sitemap"></i>
        <span>檔案結構</span>
      </div>
      <div class="tree-search">
        <i class="fas fa-search"></i>
        <input 
          v-model="treeSearchQuery" 
          placeholder="搜尋資料夾..."
          @input="filterTreeItems"
        >
      </div>
      <div class="tree-content">
        <div class="tree-item root-item" @click="navigateToRoot">
          <i class="fas fa-hdd"></i>
          <span>OneDrive</span>
        </div>
        <div 
          v-for="item in filteredTreeItems" 
          :key="item.id"
          class="tree-item"
          :style="{ paddingLeft: item.level * 20 + 'px' }"
          @click="navigateToPath(item.path)"
        >
          <i :class="item.expanded ? 'fas fa-folder-open' : 'fas fa-folder'"></i>
          <span>{{ item.name }}</span>
        </div>
      </div>
    </div>

    <!-- 主要內容區域 -->
    <div class="main-content">
      <div class="photo-manager">
        <!-- 固定的頂部工具列 -->
        <div class="fixed-header">
          <!-- 搜尋和排序工具列 -->
          <div class="toolbar">
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input 
                v-model="searchQuery" 
                placeholder="搜尋檔案..."
                class="search-input"
                @input="filterItems"
              >
            </div>
            <div class="sort-controls">
              <select v-model="sortBy" @change="sortItems" class="sort-select">
                <option value="name">名稱</option>
                <option value="date">日期</option>
                <option value="size">大小</option>
              </select>
              <button @click="toggleSortOrder" class="sort-btn">
                <i :class="sortOrder === 'asc' ? 'fas fa-sort-alpha-down' : 'fas fa-sort-alpha-up'"></i>
              </button>
            </div>
          </div>

          <!-- 目錄導航 -->
          <div class="folder-nav">
            <div class="breadcrumb">
              <span v-for="(folder, index) in currentPath" 
                    :key="index" 
                    @click="navigateToFolder(index)"
                    class="breadcrumb-item">
                <i class="fas fa-home" v-if="index === 0"></i>
                <i class="fas fa-chevron-right" v-else></i>
                {{ folder }}
              </span>
            </div>
            <div class="action-buttons">
              <button @click="showNewFolderDialog = true" class="action-btn">
                <i class="fas fa-folder-plus"></i>
                新增資料夾
              </button>
              <button @click="triggerFileInput" class="action-btn upload-btn">
                <i class="fas fa-cloud-upload-alt"></i>
                上傳媒體
              </button>
              <input 
                type="file" 
                ref="fileInput"
                accept="image/*,video/*"
                multiple
                @change="handleFileSelect"
                class="hidden"
              />
            </div>
          </div>
        </div>

        <!-- 可滾動的內容區域 -->
        <div class="scrollable-content">
          <!-- 資料夾和照片列表 -->
          <div class="content-grid">
            <!-- 資料夾 -->
            <div v-for="folder in folders" 
                 :key="folder.id" 
                 class="folder-item"
                 @click="openFolder(folder)">
              <div class="folder-icon">
                <i class="fas fa-folder"></i>
              </div>
              <span class="folder-name">{{ folder.name }}</span>
            </div>

            <!-- 照片預覽 -->
            <div v-for="media in photos" 
                 :key="media.id" 
                 class="media-item">
              <div class="media-wrapper">
                <template v-if="isImage(media)">
                  <img :src="media.thumbnailUrl" :alt="media.name">
                </template>
                <template v-else-if="isVideo(media)">
                  <div class="video-thumbnail">
                    <img :src="media.thumbnailUrl" :alt="media.name">
                    <div class="video-icon">
                      <i class="fas fa-play-circle"></i>
                    </div>
                  </div>
                </template>
                <div class="media-overlay">
                  <div class="media-type">
                    <i :class="isVideo(media) ? 'fas fa-video' : 'fas fa-image'"></i>
                  </div>
                  <span class="media-name">{{ media.name }}</span>
                  <div class="media-info">
                    <span>{{ formatFileSize(media.size) }}</span>
                    <span>{{ formatDate(media.lastModifiedDateTime) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 上傳進度 -->
        <div v-if="uploading" class="progress-overlay">
          <div class="progress-container">
            <div class="progress-bar" :style="{ width: progress + '%' }"></div>
            <div class="progress-text">
              <i class="fas fa-spinner fa-spin"></i>
              上傳進度: {{ progress }}%
            </div>
          </div>
        </div>

        <!-- 新增資料夾對話框 -->
        <div v-if="showNewFolderDialog" class="dialog-overlay">
          <div class="dialog">
            <h3><i class="fas fa-folder-plus"></i> 新增資料夾</h3>
            <input v-model="newFolderName" 
                   placeholder="請輸入資料夾名稱"
                   class="dialog-input">
            <div class="dialog-buttons">
              <button @click="createNewFolder" class="action-btn">
                <i class="fas fa-check"></i> 確定
              </button>
              <button @click="showNewFolderDialog = false" class="action-btn cancel">
                <i class="fas fa-times"></i> 取消
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const progress = ref(0);
const currentPath = ref(['OneDrive']);
const folders = ref<any[]>([]);
const photos = ref<any[]>([]);
const showNewFolderDialog = ref(false);
const newFolderName = ref('');
const searchQuery = ref('');
const sortBy = ref('name');
const sortOrder = ref('asc');
const originalFolders = ref<any[]>([]);
const originalPhotos = ref<any[]>([]);
const treeSearchQuery = ref('');
const treeItems = ref<any[]>([]);
const filteredTreeItems = ref<any[]>([]);

// 載入當前目錄內容
const loadCurrentFolder = async () => {
  if (!authStore.accessToken) return;

  try {
    // 使用個人 OneDrive API 端點
    const path = currentPath.value.slice(1).join('/');
    const endpoint = path
      ? `https://graph.microsoft.com/v1.0/me/drive/root:/${path}:/children`
      : 'https://graph.microsoft.com/v1.0/me/drive/root/children';

    console.log('請求端點:', endpoint);

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${authStore.accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('載入失敗詳情:', JSON.stringify(errorData, null, 2));
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      throw new Error(`載入失敗: ${response.status}`);
    }

    const data = await response.json();
    console.log('資料夾內容:', JSON.stringify(data, null, 2));

    // 儲存原始數據
    originalFolders.value = data.value.filter((item: any) => item.folder);
    originalPhotos.value = data.value.filter((item: any) => 
      item.file && 
      item.file.mimeType && 
      (
        item.file.mimeType.startsWith('image/') || 
        item.file.mimeType.startsWith('video/') ||
        item.file.mimeType === 'application/octet-stream'
      )
    );

    // 應用過濾和排序
    filterItems();

    // 獲取照片縮圖
    for (const photo of photos.value) {
      try {
        const thumbnailResponse = await fetch(
          `https://graph.microsoft.com/v1.0/me/drive/items/${photo.id}/thumbnails`,
          {
            headers: {
              'Authorization': `Bearer ${authStore.accessToken}`,
              'Accept': 'application/json'
            }
          }
        );
        if (thumbnailResponse.ok) {
          const thumbnailData = await thumbnailResponse.json();
          photo.thumbnailUrl = thumbnailData.value[0]?.medium?.url;
        }
      } catch (error) {
        console.error('獲取縮圖失敗:', error);
      }
    }
  } catch (error) {
    console.error('載入資料夾內容失敗:', error);
  }
};

// 載入樹狀結構
const loadTreeStructure = async () => {
  if (!authStore.accessToken) return;

  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/drive/root/children', {
      headers: {
        'Authorization': `Bearer ${authStore.accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('載入資料夾結構失敗');
    }

    const data = await response.json();
    treeItems.value = data.value
      .filter((item: any) => item.folder)
      .map((item: any) => ({
        id: item.id,
        name: item.name,
        path: item.name,
        level: 1,
        expanded: false
      }));
    
    filterTreeItems();
  } catch (error) {
    console.error('載入資料夾結構失敗:', error);
  }
};

// 創建 Photos 資料夾
const createPhotosFolder = async () => {
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/drive/root/children', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "name": "Pictures",
        "folder": {},
        "@microsoft.graph.conflictBehavior": "rename"
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('創建 Pictures 資料夾失敗:', errorData);
      throw new Error('創建 Pictures 資料夾失敗');
    }

    await loadCurrentFolder();
  } catch (error) {
    console.error('創建 Pictures 資料夾失敗:', error);
  }
};

// 創建新資料夾
const createNewFolder = async () => {
  if (!newFolderName.value || !authStore.accessToken) return;

  try {
    const path = currentPath.value.slice(1).join('/');
    const endpoint = path
      ? `https://graph.microsoft.com/v1.0/me/drive/root:/${path}:/children`
      : 'https://graph.microsoft.com/v1.0/me/drive/root/children';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "name": newFolderName.value,
        "folder": {},
        "@microsoft.graph.conflictBehavior": "rename"
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('創建資料夾失敗詳情:', errorData);
      throw new Error('創建資料夾失敗');
    }

    showNewFolderDialog.value = false;
    newFolderName.value = '';
    await loadCurrentFolder();
  } catch (error) {
    console.error('創建資料夾失敗:', error);
  }
};

// 導航到指定資料夾
const navigateToFolder = async (index: number) => {
  currentPath.value = currentPath.value.slice(0, index + 1);
  await loadCurrentFolder();
};

// 打開資料夾
const openFolder = async (folder: any) => {
  currentPath.value.push(folder.name);
  await loadCurrentFolder();
};

// 上傳檔案
const uploadFileToOneDrive = async (file: File) => {
  if (!authStore.accessToken) {
    throw new Error('未登入');
  }

  const path = currentPath.value.slice(1).join('/');
  const fileName = encodeURIComponent(file.name);
  const endpoint = path
    ? `https://graph.microsoft.com/v1.0/me/drive/root:/${path}/${fileName}:/content`
    : `https://graph.microsoft.com/v1.0/me/drive/root:/${fileName}:/content`;

  try {
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authStore.accessToken}`,
        'Content-Type': file.type
      },
      body: file
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('上傳失敗詳情:', errorData);
      throw new Error(`上傳失敗: ${response.status}`);
    }

    await loadCurrentFolder();
    return await response.json();
  } catch (error) {
    console.error('上傳過程發生錯誤:', error);
    throw error;
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  uploading.value = true;
  
  try {
    for (const file of input.files) {
      await uploadFileToOneDrive(file);
      progress.value = (Array.from(input.files).indexOf(file) + 1) / input.files.length * 100;
    }
  } catch (error) {
    console.error('上傳失敗:', error);
  } finally {
    uploading.value = false;
    progress.value = 0;
  }
};

// 過濾項目
const filterItems = () => {
  const query = searchQuery.value.toLowerCase();
  
  if (!query) {
    folders.value = originalFolders.value;
    photos.value = originalPhotos.value;
  } else {
    folders.value = originalFolders.value.filter(folder => 
      folder.name.toLowerCase().includes(query)
    );
    photos.value = originalPhotos.value.filter(photo => 
      photo.name.toLowerCase().includes(query)
    );
  }
  
  sortItems();
};

// 排序項目
const sortItems = () => {
  const compareFn = (a: any, b: any) => {
    let valueA, valueB;
    
    switch (sortBy.value) {
      case 'date':
        valueA = new Date(a.lastModifiedDateTime).getTime();
        valueB = new Date(b.lastModifiedDateTime).getTime();
        break;
      case 'size':
        valueA = a.size || 0;
        valueB = b.size || 0;
        break;
      default: // name
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
    }
    
    if (sortOrder.value === 'asc') {
      return valueA > valueB ? 1 : -1;
    } else {
      return valueA < valueB ? 1 : -1;
    }
  };

  folders.value.sort(compareFn);
  photos.value.sort(compareFn);
};

// 切換排序順序
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  sortItems();
};

// 過濾樹狀項目
const filterTreeItems = () => {
  const query = treeSearchQuery.value.toLowerCase();
  filteredTreeItems.value = treeItems.value.filter(item =>
    item.name.toLowerCase().includes(query)
  );
};

// 導航到根目錄
const navigateToRoot = async () => {
  currentPath.value = ['OneDrive'];
  await loadCurrentFolder();
};

// 導航到指定路徑
const navigateToPath = async (path: string) => {
  currentPath.value = ['OneDrive', path];
  await loadCurrentFolder();
};

// 添加新的工具函數
const isImage = (file: any) => {
  return file.file.mimeType.startsWith('image/');
};

const isVideo = (file: any) => {
  return file.file.mimeType.startsWith('video/');
};

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

onMounted(() => {
  loadCurrentFolder();
  loadTreeStructure();
});
</script>

<style scoped>
.app-container {
  display: flex;
  gap: 20px;
  padding: 20px;
  height: calc(100vh - 40px);
  background: #f8f9fa;
}

.nav-tree {
  width: 280px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tree-header {
  padding: 20px;
  background: #0078d4;
  color: white;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.tree-search {
  padding: 12px;
  border-bottom: 1px solid #e9ecef;
  position: relative;
}

.tree-search i {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.tree-search input {
  width: 100%;
  padding: 8px 12px 8px 32px;
  border: 2px solid #dee2e6;
  border-radius: 6px;
  font-size: 0.9em;
  transition: all 0.3s ease;
}

.tree-search input:focus {
  border-color: #0078d4;
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 120, 212, 0.1);
}

.tree-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0;
}

.tree-item {
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #495057;
}

.tree-item:hover {
  background: rgba(0, 120, 212, 0.1);
  color: #0078d4;
}

.tree-item i {
  width: 20px;
  color: #0078d4;
}

.root-item {
  font-weight: 600;
  color: #212529;
}

.main-content {
  flex: 1;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.photo-manager {
  padding: 0;
  max-width: none;
  margin: 0;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.fixed-header {
  background: white;
  z-index: 100;
  padding-bottom: 15px;
}

.scrollable-content {
  overflow-y: auto;
  padding-top: 15px;
  flex: 1;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.hidden {
  display: none;
}

.folder-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #0078d4;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.breadcrumb-item:hover {
  background: rgba(0, 120, 212, 0.1);
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.folder-item {
  padding: 15px;
  border-radius: 8px;
  background: #f8f9fa;
  cursor: pointer;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
}

.folder-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #0078d4;
}

.folder-icon {
  font-size: 2.5em;
  color: #0078d4;
  margin-bottom: 8px;
}

.folder-name {
  font-size: 0.9em;
  color: #495057;
}

.media-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 1;
  background: #f8f9fa;
}

.media-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.media-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.video-thumbnail {
  position: relative;
  width: 100%;
  height: 100%;
}

.video-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 3em;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  opacity: 0.8;
  transition: all 0.3s ease;
}

.media-item:hover .video-icon {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.1);
}

.media-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.media-type {
  position: absolute;
  top: -30px;
  right: 10px;
  background: rgba(0, 0, 0, 0.6);
  padding: 5px 8px;
  border-radius: 4px;
}

.media-name {
  font-size: 0.9em;
  margin-bottom: 5px;
  display: block;
}

.media-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.8em;
  opacity: 0.8;
}

.media-item:hover .media-overlay {
  transform: translateY(0);
}

.media-item:hover img {
  transform: scale(1.05);
}

.action-btn {
  padding: 8px 16px;
  background: #0078d4;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: #006cbd;
  transform: translateY(-1px);
}

.action-btn.cancel {
  background: #dc3545;
}

.action-btn.cancel:hover {
  background: #c82333;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.dialog {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.dialog h3 {
  margin: 0 0 20px;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dialog-input {
  width: 100%;
  padding: 10px;
  border: 2px solid #dee2e6;
  border-radius: 6px;
  margin-bottom: 20px;
  transition: border-color 0.3s ease;
}

.dialog-input:focus {
  border-color: #0078d4;
  outline: none;
}

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.progress-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.progress-container {
  width: 400px;
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.progress-bar {
  height: 8px;
  background: #0078d4;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  margin-top: 12px;
  text-align: center;
  color: #495057;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.toolbar {
  margin-bottom: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 2px solid #dee2e6;
  border-radius: 6px;
  font-size: 0.9em;
  transition: all 0.3s ease;
}

.search-input:focus {
  border-color: #0078d4;
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 120, 212, 0.1);
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-select {
  padding: 8px 12px;
  border: 2px solid #dee2e6;
  border-radius: 6px;
  background: white;
  font-size: 0.9em;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sort-select:focus {
  border-color: #0078d4;
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 120, 212, 0.1);
}

.sort-btn {
  padding: 8px 12px;
  border: 2px solid #dee2e6;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sort-btn:hover {
  border-color: #0078d4;
  color: #0078d4;
}

.sort-btn i {
  font-size: 1.1em;
}

/* 添加滾動條樣式 */
.tree-content::-webkit-scrollbar,
.main-content::-webkit-scrollbar {
  width: 8px;
}

.tree-content::-webkit-scrollbar-track,
.main-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.tree-content::-webkit-scrollbar-thumb,
.main-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.tree-content::-webkit-scrollbar-thumb:hover,
.main-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> 