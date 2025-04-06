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
const storiesContainer = document.getElementById('storiesContainer');
const genreList = document.getElementById('genreList');
const storyModal = new bootstrap.Modal(document.getElementById('storyModal'));
const chapterModal = new bootstrap.Modal(document.getElementById('chapterModal'));

// Các thể loại truyện (có thể lấy từ database nếu muốn)
const genres = [
    "Ngôn Tình", "Quan Trường", "Khoa Huyễn", "Hệ Thống", 
    "Huyền Huyễn", "Kiếm Hiệp", "Dị Giới", "Linh Dị", "Xuyên Không"
];

// Hiển thị danh sách thể loại
function displayGenres() {
    genreList.innerHTML = '';
    const allItem = document.createElement('button');
    allItem.className = 'list-group-item list-group-item-action active';
    allItem.textContent = 'Tất cả';
    allItem.addEventListener('click', () => {
        document.querySelectorAll('#genreList button').forEach(btn => btn.classList.remove('active'));
        allItem.classList.add('active');
        loadStories();
    });
    genreList.appendChild(allItem);
    
    genres.forEach(genre => {
        const item = document.createElement('button');
        item.className = 'list-group-item list-group-item-action';
        item.textContent = genre;
        item.addEventListener('click', () => {
            document.querySelectorAll('#genreList button').forEach(btn => btn.classList.remove('active'));
            item.classList.add('active');
            loadStoriesByGenre(genre);
        });
        genreList.appendChild(item);
    });
}

// Tải tất cả truyện
function loadStories() {
    storiesRef.once('value').then(snapshot => {
        storiesContainer.innerHTML = '';
        const stories = snapshot.val();
        
        for (const storyId in stories) {
            if (stories.hasOwnProperty(storyId)) {
                createStoryCard(storyId, stories[storyId]);
            }
        }
    });
}

// Tải truyện theo thể loại
function loadStoriesByGenre(genre) {
    storiesRef.once('value').then(snapshot => {
        storiesContainer.innerHTML = '';
        const stories = snapshot.val();
        
        for (const storyId in stories) {
            if (stories.hasOwnProperty(storyId) && stories[storyId].genre === genre) {
                createStoryCard(storyId, stories[storyId]);
            }
        }
    });
}

// Tạo card truyện
function createStoryCard(storyId, story) {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';
    
    const card = document.createElement('div');
    card.className = 'card h-100';
    
    const img = document.createElement('img');
    img.className = 'card-img-top';
    img.src = story.image || 'https://via.placeholder.com/300x200';
    img.alt = story.title;
    img.style.height = '200px';
    img.style.objectFit = 'cover';
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    const title = document.createElement('h5');
    title.className = 'card-title';
    title.textContent = story.title;
    
    const author = document.createElement('p');
    author.className = 'card-text';
    author.innerHTML = `<small class="text-muted">Tác giả: ${story.author}</small>`;
    
    const genre = document.createElement('p');
    genre.className = 'card-text';
    genre.innerHTML = `<span class="badge bg-primary">${story.genre}</span>`;
    
    const views = document.createElement('p');
    views.className = 'card-text';
    views.innerHTML = `<small>Lượt xem: ${story.views || 0}</small>`;
    
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary btn-sm';
    btn.textContent = 'Xem chi tiết';
    btn.addEventListener('click', () => openStoryModal(storyId, story));
    
    cardBody.appendChild(title);
    cardBody.appendChild(author);
    cardBody.appendChild(genre);
    cardBody.appendChild(views);
    cardBody.appendChild(btn);
    
    card.appendChild(img);
    card.appendChild(cardBody);
    col.appendChild(card);
    storiesContainer.appendChild(col);
}

// Mở modal chi tiết truyện
function openStoryModal(storyId, story) {
    document.getElementById('storyModalTitle').textContent = story.title;
    document.getElementById('storyModalImage').src = story.image;
    document.getElementById('storyModalAuthor').textContent = story.author;
    document.getElementById('storyModalGenre').textContent = story.genre;
    document.getElementById('storyModalViews').textContent = story.views || 0;
    
    const chaptersList = document.getElementById('chaptersList');
    chaptersList.innerHTML = '';
    
    if (story.chapters) {
        for (const chapterId in story.chapters) {
            if (story.chapters.hasOwnProperty(chapterId)) {
                const chapter = story.chapters[chapterId];
                
                const chapterItem = document.createElement('button');
                chapterItem.className = 'list-group-item list-group-item-action';
                chapterItem.innerHTML = `
                    <div class="d-flex justify-content-between">
                        <span>${chapter.title}</span>
                        <span class="text-muted">${chapter.views || 0} lượt xem</span>
                    </div>
                `;
                
                chapterItem.addEventListener('click', () => {
                    openChapterModal(story.title, chapter.title, chapter.content);
                });
                
                chaptersList.appendChild(chapterItem);
            }
        }
    } else {
        const noChapter = document.createElement('div');
        noChapter.className = 'alert alert-info';
        noChapter.textContent = 'Truyện chưa có chương nào';
        chaptersList.appendChild(noChapter);
    }
    
    storyModal.show();
}

// Mở modal nội dung chương
function openChapterModal(storyTitle, chapterTitle, content) {
    document.getElementById('chapterModalTitle').textContent = `${storyTitle} - ${chapterTitle}`;
    document.getElementById('chapterContent').innerHTML = content.replace(/\n/g, '<br>');
    chapterModal.show();
}

// Xử lý đăng nhập/đăng xuất
function setupAuth() {
    auth.onAuthStateChanged(user => {
        if (user) {
            // Người dùng đã đăng nhập
            loginBtn.classList.add('d-none');
            logoutBtn.classList.remove('d-none');
        } else {
            // Người dùng chưa đăng nhập
            loginBtn.classList.remove('d-none');
            logoutBtn.classList.add('d-none');
        }
    });
    
    loginBtn.addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch(error => {
            console.error('Lỗi đăng nhập:', error);
        });
    });
    
    logoutBtn.addEventListener('click', () => {
        auth.signOut();
    });
}

// Khởi chạy ứng dụng
function initApp() {
    displayGenres();
    loadStories();
    setupAuth();
}

// Khi DOM đã tải xong
document.addEventListener('DOMContentLoaded', initApp);