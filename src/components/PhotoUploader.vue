<template>
  <div class="photo-manager">
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
      <button @click="showNewFolderDialog = true" class="action-btn">
        <i class="fas fa-folder-plus"></i>
        新增資料夾
      </button>
    </div>

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
      <div v-for="photo in photos" 
           :key="photo.id" 
           class="photo-item">
        <div class="photo-wrapper">
          <img :src="photo.thumbnailUrl" :alt="photo.name">
          <div class="photo-overlay">
            <span class="photo-name">{{ photo.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 上傳按鈕 -->
    <div class="upload-section">
      <input 
        type="file" 
        ref="fileInput"
        accept="image/*"
        multiple
        @change="handleFileSelect"
        class="hidden"
      />
      <button @click="triggerFileInput" class="action-btn upload-btn">
        <i class="fas fa-cloud-upload-alt"></i>
        上傳照片
      </button>
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

onMounted(loadCurrentFolder);
</script>

<style scoped>
.photo-manager {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
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

.photo-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 1;
}

.photo-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.photo-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.photo-item:hover .photo-overlay {
  transform: translateY(0);
}

.photo-item:hover img {
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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
</style> 