$(document).ready(async () => {
  await getPosts();

  setupObservable();
  initActions();
})

// adding photo
async function loadPhoto(file) {
  const photoUrl = window.URL.createObjectURL(file);
  const createdPost = await post('http://5c332abce0948000147a7749.mockapi.io/api/v1/posts');
  createdPost.photoUrl = photoUrl;
  renderPost(createdPost);
}

// config observable for loading more comments
function setupObservable() {
  var targetNode = $(".posts")[0];

  var config = {
    childList: true,
    subtree: true
  };

  var callback = function (mutationsList, observer) {
    for (var mutation of mutationsList)
      if (mutation.type == 'childList')
        if (mutation.addedNodes.length && mutation.addedNodes[0].className == 'more-comments')
          $(mutation.addedNodes[0]).click(async () => {
            const postId = getPostId($(mutation.target));
            const comments = await get(`http://5c332abce0948000147a7749.mockapi.io/api/v1/posts/${postId}/comments`);
            sortByDate(comments);

            for (let i = 4; i < comments.length; i++)
              afterComment(postId, comments[i].username, comments[i].text);

            $(`#p${postId} .more-comments`).addClass('hidden');
          });
  };

  var observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
}

// main action buttons initialization 
function initActions() {
  // like the post button
  $(".like-btn").click(async function () {
    const id = getPostId($(this));
    const countText = $(`#p${id} .likes-count`)[0].innerText;
    let count = parseInt(countText.match(/\d+\D/)[0]);
    if ($(this).hasClass('liked'))
      count -= 1;
    else
      count += 1;

    await put(`http://5c332abce0948000147a7749.mockapi.io/api/v1/posts/${id}`, {
      likes: count
    });

    $(`#p${id} .likes-count`)[0].innerText = count + " likes";
    $(this).toggleClass('liked');
  });

  // scroll to comment button
  $('.comment-btn').click(function () {
    $('html, body').animate({
      scrollTop: $(`#p${getPostId($(this))} .comments`).offset().top - 45
    })
  });

  // delete post button
  $('.delete-btn').click(async function () {
    const id = getPostId($(this));
    $(`#p${id}`).remove();
    await del(`http://5c332abce0948000147a7749.mockapi.io/api/v1/posts/${id}`);
  });
}

// renders all posts
async function getPosts() {
  $('.posts').innerHTML = '';
  const posts = await get('http://5c332abce0948000147a7749.mockapi.io/api/v1/posts');
  await sortByDate(posts);

  await posts.reverse().forEach(post => renderPost(post));
}

// renders one post by post object
function renderPost(post) {
  const posts = $('.posts');
  const postHtml = `
    <div id="p${post.id}" class="post">
      <div class="post-header">
        <img src="${post.avatar}" class="avatar">
        <div class="username bold-font">${post.username}</div>
        <img src="./icons/del.png" class="delete-btn float-right">
      </div>
      <div class="post-photo">
        <image src="${post.photoUrl}" />
      </div>
      <div class="post-footer">
        <section class="d-flex">
          <div class="post-btn">
            <div class="like-btn"></div>
          </div>
          <div class="post-btn">
            <div class="comment-btn"></div>
          </div>
        </section>

        <div class="likes-count bold-font">${post.likes} likes</div>

        <div class="comments"></div>

        <div class="post-time"></div>
      </div>
    </div>`

  posts.prepend(postHtml);

  // displays post decription
  appendComment(post.id, post.username, post.title);

  // displays comments to the post
  renderComments(post.id);

  // displays time when post was added
  const time = moment(post.createdAt).fromNow();
  $(`#p${post.id} .post-time`).append(time);
}

// renders all comments for the certain post
async function renderComments(postId) {
  const comments = await get(`http://5c332abce0948000147a7749.mockapi.io/api/v1/posts/${postId}/comments`);
  if (comments.length) {
    sortByDate(comments);

    let n = comments.length - 1;
    // if more than 4 comments, adds expand button
    if (comments.length > 4) {
      const commentsHtml = $(`#p${postId} .comments`);
      commentsHtml.append('<div class="more-comments">Load more comments</div>');
      n = 3;
    }

    for (let i = n; i >= 0; i--)
      appendComment(postId, comments[i].username, comments[i].text);
  }
}

// adds comment
function afterComment(id, username, text) {
  $(`#p${id} .more-comments`).after(getComment(username, text));
}

// adds comment ahead
function appendComment(id, username, text) {
  $(`#p${id} .comments`).append(getComment(username, text));
}

// returns comment html
const getComment = (username, text) => {
  return `
    <div class="comment">
      <div class="username bold-font">${username}</div>
      <div class="comment-text">${text}</div>
    </div>`;
}

// sort array by field 'createdAt'
const sortByDate = async (arr) => {
  return arr.sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

// gets post id for certain node
const getPostId = (node) => {
  const currPost = node.parents('.post')[0];
  return parseInt(currPost.id.slice(1));
}

// HTTP GET, POST, PUT, DELETE requests:
const get = async (url = '') => {
  return await fetch(url).then(response => response.json());
}
const post = async (url = '', data = {}) => {
  return await fetch(url, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  }).then(response => response.json());
}
const put = async (url = '', data = {}) => {
  return await fetch(url, {
    method: 'PUT',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  }).then(response => response.json());
}
const del = async (url = '') => {
  return await fetch(url, {
    method: 'DELETE'
  }).then(response => response.json());
}