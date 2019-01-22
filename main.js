$(document).ready(async () => {
  await getPosts();
  setupObservable();
})

function setupObservable() {
  var targetNode = $(".posts")[0];

  var config = {
    childList: true,
    subtree: true
  };

  var callback = function (mutationsList, observer) {
    for (var mutation of mutationsList) {
      if (mutation.type == 'childList') {
        if (mutation.addedNodes[0].className == "more-comments") {
          $(mutation.addedNodes[0]).click(async () => {
            const postId = parseInt(mutation.target.parentNode.parentNode.id.slice(1));
            const comments = await get(`http://5c332abce0948000147a7749.mockapi.io/api/v1/posts/${postId}/comments`);
            sortByDate(comments);

            for (let i = 4; i < comments.length; i++) {
              afterComment(postId, comments[i].username, comments[i].text);
            }

            $(`#p${postId} .more-comments`).addClass('hidden');
          });
        }
      }
    }
  };

  var observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
}

async function getPosts() {
  const posts = await get("http://5c332abce0948000147a7749.mockapi.io/api/v1/posts");
  await sortByDate(posts);

  await posts.forEach(post => renderPost(post));
}

function renderPost(post) {
  const posts = $('.posts');
  const postHtml = `
    <div id="p${post.id}" class="post">
      <div class="post-header">
          <img src="${post.avatar}" alt="">
        <div class="username bold-font">${post.username}</div>
      </div>
      <div class="post-photo">
        <image src="${post.photoUrl}" />
      </div>
      <div class="post-footer">
        <section class="d-flex">
          <button class="post-btn">
            <div class="like-btn"></div>
          </button>
          <button class="post-btn">
            <div class="comment-btn"></div>
          </button>
        </section>

        <section class="likes-count">
          <div class="bold-font">${post.likes} likes</div>
        </section>

        <div class="comments"></div>

        <div class="post-time">3 hours ago</div>
      </div>
    </div>`

  posts.append(postHtml);

  // displays post decription
  appendComment(post.id, post.username, post.title);

  // displays comments to the post
  renderComments(post.id);
}

async function renderComments(postId) {
  const comments = await get(`http://5c332abce0948000147a7749.mockapi.io/api/v1/posts/${postId}/comments`);
  sortByDate(comments);

  let n = comments.length - 1;
  // if more than 4 comments, adds expand button
  if (comments.length > 4) {
    const commentsHtml = $(`#p${postId} .comments`);
    commentsHtml.append(`<div class="more-comments">Load more comments</div>`);
    n = 3;
  }

  for (let i = n; i >= 0; i--)
    appendComment(postId, comments[i].username, comments[i].text);
}

function appendComment(id, username, text) {
  $(`#p${id} .comments`).append(getComment(username, text));
}

function afterComment(id, username, text) {
  $(`#p${id} .more-comments`).after(getComment(username, text));
}

const getComment = (username, text) => {
  return `
    <div class="comment">
      <div class="username bold-font">${username}</div>
      <div class="comment-text">${text}</div>
    </div>
  `;
}

const sortByDate = async (arr) => {
  return arr.sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

const get = async (url = '') => {
  return await fetch(url).then(response => response.json());
}