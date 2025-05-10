// Khởi tạo Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAmNTV2Gn_1ja4XyYeUOTjukktzjKcbRAI",
    authDomain: "apptruyen-670b1.firebaseapp.com",
    databaseURL: "https://apptruyen-670b1-default-rtdb.firebaseio.com",
    projectId: "apptruyen-670b1",
    storageBucket: "apptruyen-670b1.firebasestorage.app",
    messagingSenderId: "786140899201",
    appId: "1:786140899201:web:ddb0a74ba0e8b000caaa80",
    measurementId: "G-GKRH6H98MR"
};

// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// Tham chiếu đến các node trong Realtime Database
const storiesRef = database.ref('stories');
const usersRef = database.ref('Users');

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const navStories = document.getElementById('navStories');
const navUsers = document.getElementById('navUsers');
const mainContent = document.getElementById('mainContent');
const searchInput = document.getElementById('searchInput');
const genreList = document.getElementById('genreList');

// Modal và các thành phần liên quan
const storyEditModal = new bootstrap.Modal(document.getElementById('storyEditModal'));
const chaptersModal = new bootstrap.Modal(document.getElementById('chaptersModal'));
const chapterEditModal = new bootstrap.Modal(document.getElementById('chapterEditModal'));
const confirmDeleteModal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));

// Các thể loại truyện
const genres = [
    "Ngôn Tình", "Quan Trường", "Khoa Huyễn", "Hệ Thống", 
    "Huyền Huyễn", "Kiếm Hiệp", "Dị Giới", "Linh Dị", "Xuyên Không"
];

// Biến toàn cục
let currentUser = null;
let currentStoryId = null;
let currentChapterId = null;
let deleteCallback = null;

// Khởi tạo ứng dụng
function initApp() {
    setupAuth();
    setupEventListeners();
    displayGenres();
    showStoriesView();
}

// Thiết lập các sự kiện
function setupEventListeners() {
    // Navigation
    navStories.addEventListener('click', showStoriesView);
    navUsers.addEventListener('click', showUsersView);
    
    // Story modal
    document.getElementById('saveStoryBtn').addEventListener('click', saveStory);
    document.getElementById('storyImage').addEventListener('input', function() {
        document.getElementById('storyImagePreview').src = this.value || 'https://via.placeholder.com/300x200';
    });
    
    // Chapters modal
    document.getElementById('addChapterBtn').addEventListener('click', addNewChapter);
    
    // Chapter modal
    document.getElementById('saveChapterBtn').addEventListener('click', saveChapter);
    
    // Delete confirmation
    document.getElementById('confirmDeleteBtn').addEventListener('click', function() {
        if (deleteCallback) deleteCallback();
        confirmDeleteModal.hide();
    });
    
    // Search
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        filterStories(searchTerm);
    });
}

// Xử lý đăng nhập/đăng xuất
function setupAuth() {
    auth.onAuthStateChanged(user => {
        currentUser = user;
        if (user) {
            // Người dùng đã đăng nhập
            loginBtn.classList.add('d-none');
            logoutBtn.classList.remove('d-none');
            
            // Kiểm tra quyền admin
            checkAdminStatus(user.uid);
        } else {
            // Người dùng chưa đăng nhập
            loginBtn.classList.remove('d-none');
            logoutBtn.classList.add('d-none');
            mainContent.innerHTML = '<div class="alert alert-warning">Vui lòng đăng nhập để tiếp tục</div>';
        }
    });
    
    loginBtn.addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch(error => {
            console.error('Lỗi đăng nhập:', error);
            alert('Đăng nhập thất bại: ' + error.message);
        });
    });
    
    logoutBtn.addEventListener('click', () => {
        auth.signOut();
    });
}

// Kiểm tra quyền admin
function checkAdminStatus(userId) {
    usersRef.child(userId).once('value').then(snapshot => {
        const userData = snapshot.val();
        if (!userData || !userData.isAdmin) {
            alert('Bạn không có quyền truy cập trang admin');
            auth.signOut();
        }
    });
}

// Hiển thị danh sách thể loại
function displayGenres() {
    genreList.innerHTML = '';
    const allItem = document.createElement('button');
    allItem.className = 'list-group-item list-group-item-action active';
    allItem.textContent = 'Tất cả';
    allItem.addEventListener('click', () => {
        document.querySelectorAll('#genreList button').forEach(btn => btn.classList.remove('active'));
        allItem.classList.add('active');
        showStoriesView();
    });
    genreList.appendChild(allItem);
    
    genres.forEach(genre => {
        const item = document.createElement('button');
        item.className = 'list-group-item list-group-item-action';
        item.textContent = genre;
        item.addEventListener('click', () => {
            document.querySelectorAll('#genreList button').forEach(btn => btn.classList.remove('active'));
            item.classList.add('active');
            showStoriesView(genre);
        });
        genreList.appendChild(item);
    });
}

// Hiển thị view quản lý truyện
function showStoriesView(genre = null) {
    mainContent.innerHTML = `
        <div class="card">
            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="bi bi-book"></i> Quản lý truyện</h5>
                <button class="btn btn-light btn-sm" id="addStoryBtn"><i class="bi bi-plus"></i> Thêm truyện</button>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>Tiêu đề</th>
                                <th>Tác giả</th>
                                <th>Thể loại</th>
                                <th>Lượt xem</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody id="storiesTableBody">
                            <!-- Danh sách truyện sẽ được thêm bằng JS -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('addStoryBtn').addEventListener('click', addNewStory);
    loadStoriesTable(genre);
}

// Tải danh sách truyện vào bảng
function loadStoriesTable(genre = null) {
    storiesRef.once('value').then(snapshot => {
        const storiesTableBody = document.getElementById('storiesTableBody');
        storiesTableBody.innerHTML = '';
        
        const stories = snapshot.val();
        let count = 1;
        
        for (const storyId in stories) {
            if (stories.hasOwnProperty(storyId)) {
                const story = stories[storyId];
                
                if (genre && story.genre !== genre) continue;
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${count++}</td>
                    <td>${story.title}</td>
                    <td>${story.author}</td>
                    <td><span class="badge bg-primary">${story.genre}</span></td>
                    <td>${story.views || 0}</td>
                    <td>
                        <button class="btn btn-sm btn-primary edit-story" data-id="${storyId}"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-danger delete-story" data-id="${storyId}"><i class="bi bi-trash"></i></button>
                        <button class="btn btn-sm btn-success manage-chapters" data-id="${storyId}"><i class="bi bi-list-ol"></i></button>
                    </td>
                `;
                
                storiesTableBody.appendChild(row);
            }
        }
        
        // Thêm sự kiện cho các nút
        document.querySelectorAll('.edit-story').forEach(btn => {
            btn.addEventListener('click', function() {
                editStory(this.getAttribute('data-id'));
            });
        });
        
        document.querySelectorAll('.delete-story').forEach(btn => {
            btn.addEventListener('click', function() {
                confirmDelete('Bạn có chắc muốn xóa truyện này?', () => {
                    deleteStory(this.getAttribute('data-id'));
                });
            });
        });
        
        document.querySelectorAll('.manage-chapters').forEach(btn => {
            btn.addEventListener('click', function() {
                manageChapters(this.getAttribute('data-id'));
            });
        });
    });
}

// Hiển thị view quản lý người dùng
function showUsersView() {
    mainContent.innerHTML = `
        <div class="card">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0"><i class="bi bi-people"></i> Quản lý người dùng</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>User ID</th>
                                <th>Admin</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody id="usersTableBody">
                            <!-- Danh sách người dùng sẽ được thêm bằng JS -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    loadUsersTable();
}

// Tải danh sách người dùng vào bảng
function loadUsersTable() {
    usersRef.once('value').then(snapshot => {
        const usersTableBody = document.getElementById('usersTableBody');
        usersTableBody.innerHTML = '';
        
        const users = snapshot.val();
        
        for (const userId in users) {
            if (users.hasOwnProperty(userId)) {
                const user = users[userId];
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${userId}</td>
                    <td>${user.isAdmin ? '<span class="badge bg-success">Admin</span>' : '<span class="badge bg-secondary">User</span>'}</td>
                    <td>
                        <button class="btn btn-sm btn-warning toggle-admin" data-id="${userId}" data-admin="${user.isAdmin || false}">
                            ${user.isAdmin ? '<i class="bi bi-person-dash"></i> Hủy admin' : '<i class="bi bi-person-plus"></i> Thêm admin'}
                        </button>
                    </td>
                `;
                
                usersTableBody.appendChild(row);
            }
        }
        
        // Thêm sự kiện cho các nút
        document.querySelectorAll('.toggle-admin').forEach(btn => {
            btn.addEventListener('click', function() {
                toggleAdminStatus(
                    this.getAttribute('data-id'), 
                    this.getAttribute('data-admin') === 'true'
                );
            });
        });
    });
}

// Thêm truyện mới
function addNewStory() {
    document.getElementById('storyModalTitle').textContent = 'Thêm truyện mới';
    document.getElementById('storyForm').reset();
    document.getElementById('storyId').value = '';
    document.getElementById('storyImagePreview').src = 'https://via.placeholder.com/300x200';
    
    // Đổ dữ liệu thể loại vào select
    const genreSelect = document.getElementById('storyGenre');
    genreSelect.innerHTML = '';
    genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        genreSelect.appendChild(option);
    });
    
    storyEditModal.show();
}

// Chỉnh sửa truyện
function editStory(storyId) {
    storiesRef.child(storyId).once('value').then(snapshot => {
        const story = snapshot.val();
        
        document.getElementById('storyModalTitle').textContent = 'Chỉnh sửa truyện';
        document.getElementById('storyId').value = storyId;
        document.getElementById('storyTitle').value = story.title;
        document.getElementById('storyAuthor').value = story.author;
        document.getElementById('storyViews').value = story.views || 0;
        document.getElementById('storyImage').value = story.image || '';
        document.getElementById('storyImagePreview').src = story.image || 'https://via.placeholder.com/300x200';
        
        // Đổ dữ liệu thể loại vào select
        const genreSelect = document.getElementById('storyGenre');
        genreSelect.innerHTML = '';
        genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = genre;
            option.selected = (genre === story.genre);
            genreSelect.appendChild(option);
        });
        
        storyEditModal.show();
    });
}

// Lưu truyện (thêm mới hoặc cập nhật)
function saveStory() {
    const storyId = document.getElementById('storyId').value;
    const storyData = {
        title: document.getElementById('storyTitle').value,
        author: document.getElementById('storyAuthor').value,
        genre: document.getElementById('storyGenre').value,
        views: parseInt(document.getElementById('storyViews').value) || 0,
        image: document.getElementById('storyImage').value || ''
    };
    
    if (!storyData.title || !storyData.author || !storyData.genre) {
        alert('Vui lòng điền đầy đủ thông tin');
        return;
    }
    
    if (storyId) {
        // Cập nhật truyện đã có
        storiesRef.child(storyId).update(storyData)
            .then(() => {
                alert('Cập nhật truyện thành công');
                storyEditModal.hide();
                showStoriesView();
            })
            .catch(error => {
                alert('Lỗi khi cập nhật truyện: ' + error.message);
            });
    } else {
        // Thêm truyện mới
        const newStoryRef = storiesRef.push();
        newStoryRef.set(storyData)
            .then(() => {
                alert('Thêm truyện mới thành công');
                storyEditModal.hide();
                showStoriesView();
            })
            .catch(error => {
                alert('Lỗi khi thêm truyện mới: ' + error.message);
            });
    }
}

// Xóa truyện
function deleteStory(storyId) {
    storiesRef.child(storyId).remove()
        .then(() => {
            alert('Xóa truyện thành công');
            showStoriesView();
        })
        .catch(error => {
            alert('Lỗi khi xóa truyện: ' + error.message);
        });
}

// Quản lý chương
function manageChapters(storyId) {
    currentStoryId = storyId;
    
    storiesRef.child(storyId).once('value').then(snapshot => {
        const story = snapshot.val();
        document.getElementById('chaptersStoryTitle').textContent = story.title;
        
        loadChaptersTable(storyId);
        chaptersModal.show();
    });
}

// Tải danh sách chương vào bảng
function loadChaptersTable(storyId) {
    storiesRef.child(`${storyId}/chapters`).once('value').then(snapshot => {
        const chaptersTableBody = document.getElementById('chaptersTableBody');
        chaptersTableBody.innerHTML = '';
        
        const chapters = snapshot.val();
        let count = 1;
        
        if (chapters) {
            document.getElementById('totalChapters').textContent = Object.keys(chapters).length;
            
            for (const chapterId in chapters) {
                if (chapters.hasOwnProperty(chapterId)) {
                    const chapter = chapters[chapterId];
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${count++}</td>
                        <td>${chapter.title}</td>
                        <td>${chapter.views || 0}</td>
                        <td>
                            <button class="btn btn-sm btn-primary edit-chapter" data-id="${chapterId}"><i class="bi bi-pencil"></i></button>
                            <button class="btn btn-sm btn-danger delete-chapter" data-id="${chapterId}"><i class="bi bi-trash"></i></button>
                        </td>
                    `;
                    
                    chaptersTableBody.appendChild(row);
                }
            }
        } else {
            document.getElementById('totalChapters').textContent = '0';
            chaptersTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">Truyện chưa có chương nào</td>
                </tr>
            `;
        }
        
        // Thêm sự kiện cho các nút
        document.querySelectorAll('.edit-chapter').forEach(btn => {
            btn.addEventListener('click', function() {
                editChapter(this.getAttribute('data-id'));
            });
        });
        
        document.querySelectorAll('.delete-chapter').forEach(btn => {
            btn.addEventListener('click', function() {
                confirmDelete('Bạn có chắc muốn xóa chương này?', () => {
                    deleteChapter(this.getAttribute('data-id'));
                });
            });
        });
    });
}

// Thêm chương mới
function addNewChapter() {
    document.getElementById('chapterModalTitle').textContent = 'Thêm chương mới';
    document.getElementById('chapterForm').reset();
    document.getElementById('chapterId').value = '';
    document.getElementById('storyIdForChapter').value = currentStoryId;
    chapterEditModal.show();
}

// Chỉnh sửa chương
function editChapter(chapterId) {
    currentChapterId = chapterId;
    
    storiesRef.child(`${currentStoryId}/chapters/${chapterId}`).once('value').then(snapshot => {
        const chapter = snapshot.val();
        
        document.getElementById('chapterModalTitle').textContent = 'Chỉnh sửa chương';
        document.getElementById('chapterId').value = chapterId;
        document.getElementById('storyIdForChapter').value = currentStoryId;
        document.getElementById('chapterTitle').value = chapter.title;
        document.getElementById('chapterViews').value = chapter.views || 0;
        document.getElementById('chapterContent').value = chapter.content;
        
        chapterEditModal.show();
    });
}

// Lưu chương (thêm mới hoặc cập nhật)
function saveChapter() {
    const chapterId = document.getElementById('chapterId').value;
    const storyId = document.getElementById('storyIdForChapter').value;
    const chapterData = {
        title: document.getElementById('chapterTitle').value,
        views: parseInt(document.getElementById('chapterViews').value) || 0,
        content: document.getElementById('chapterContent').value
    };
    
    if (!chapterData.title || !chapterData.content) {
        alert('Vui lòng điền đầy đủ thông tin');
        return;
    }
    
    if (chapterId) {
        // Cập nhật chương đã có
        storiesRef.child(`${storyId}/chapters/${chapterId}`).update(chapterData)
            .then(() => {
                alert('Cập nhật chương thành công');
                chapterEditModal.hide();
                loadChaptersTable(storyId);
            })
            .catch(error => {
                alert('Lỗi khi cập nhật chương: ' + error.message);
            });
    } else {
        // Thêm chương mới
        const newChapterRef = storiesRef.child(`${storyId}/chapters`).push();
        newChapterRef.set(chapterData)
            .then(() => {
                alert('Thêm chương mới thành công');
                chapterEditModal.hide();
                loadChaptersTable(storyId);
            })
            .catch(error => {
                alert('Lỗi khi thêm chương mới: ' + error.message);
            });
    }
}

// Xóa chương
function deleteChapter(chapterId) {
    storiesRef.child(`${currentStoryId}/chapters/${chapterId}`).remove()
        .then(() => {
            alert('Xóa chương thành công');
            loadChaptersTable(currentStoryId);
        })
        .catch(error => {
            alert('Lỗi khi xóa chương: ' + error.message);
        });
}

// Chuyển đổi trạng thái admin
function toggleAdminStatus(userId, isAdmin) {
    usersRef.child(userId).update({ isAdmin: !isAdmin })
        .then(() => {
            alert(`Đã ${isAdmin ? 'hủy quyền admin' : 'thêm quyền admin'} thành công`);
            showUsersView();
        })
        .catch(error => {
            alert('Lỗi khi cập nhật quyền admin: ' + error.message);
        });
}

// Hiển thị hộp thoại xác nhận xóa
function confirmDelete(message, callback) {
    document.getElementById('deleteMessage').textContent = message;
    deleteCallback = callback;
    confirmDeleteModal.show();
}

// Lọc truyện theo từ khóa
function filterStories(searchTerm) {
    const rows = document.querySelectorAll('#storiesTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Khi DOM đã tải xong
document.addEventListener('DOMContentLoaded', initApp);
