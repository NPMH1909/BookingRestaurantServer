function buildTree(comments, parentId = null) {
  const tree = [];
  for (const comment of comments) {
    if (String(comment.parentId) === String(parentId)) {
      const children = buildTree(comments, comment._id);
      if (children.length) {
        comment.children = children;
      }
      tree.push(comment);
    }
  }
  return tree;
}

export default buildTree