// 二色木（Red-Black Tree）の解説コード

enum Color {
  RED = "RED",
  BLACK = "BLACK",
}

class Node {
  value: number;
  color: Color = Color.RED; // 新しいノードは赤
  left: Node | null = null;
  right: Node | null = null;
  parent: Node | null = null;

  constructor(value: number) {
    this.value = value;
  }
}

class RedBlackTree {
  root: Node | null = null;

  // ====== 基本操作 ======

  insert(value: number): void {
    if (this.root === null) {
      this.root = new Node(value);
      this.root.color = Color.BLACK; // ルートは常に黒
      return;
    }

    // 通常のBST挿入
    let current: Node | null = this.root;
    let parent: Node | null = null;
    while (current) {
      parent = current;
      if (value < current.value) {
        current = current.left;
      } else {
        current = current.right;
      }
    }

    const newNode = new Node(value);
    newNode.parent = parent;

    if (value < parent!.value) {
      parent!.left = newNode;
    } else {
      parent!.right = newNode;
    }

    // 平衡を修正
    this.fixInsert(newNode);
  }

  // ====== 二色木のルール ======
  // 1. ノードは赤か黒
  // 2. ルートは黒
  // 3. 葉（null）は黒と見なす
  // 4. 赤いノードの子は黒（赤が連続しない）
  // 5. ルートから葉までの黒いノード数は同じ

  private fixInsert(node: Node): void {
    while (node.parent && node.parent.color === Color.RED) {
      if (node.parent === node.parent.parent?.left) {
        const uncle = node.parent.parent?.right;

        // ケース1: 叔父が赤い → 色を変える
        if (uncle && uncle.color === Color.RED) {
          node.parent.color = Color.BLACK;
          uncle.color = Color.BLACK;
          node.parent.parent!.color = Color.RED;
          node = node.parent.parent!;
        } else {
          // ケース2・3: 叔父が黒い → 回転が必要

          // ケース2: 三角形の形 → 回転で一直線に
          if (node === node.parent.right) {
            node = node.parent;
            this.rotateLeft(node);
          }

          // ケース3: 一直線の形 → 回転と色変更
          node.parent!.color = Color.BLACK;
          node.parent!.parent!.color = Color.RED;
          this.rotateRight(node.parent!.parent!);
        }
      } else {
        // 左右対称のケース
        const uncle = node.parent.parent?.left;

        if (uncle && uncle.color === Color.RED) {
          node.parent.color = Color.BLACK;
          uncle.color = Color.BLACK;
          node.parent.parent!.color = Color.RED;
          node = node.parent.parent!;
        } else {
          if (node === node.parent.left) {
            node = node.parent;
            this.rotateRight(node);
          }

          node.parent!.color = Color.BLACK;
          node.parent!.parent!.color = Color.RED;
          this.rotateLeft(node.parent!.parent!);
        }
      }
    }
    this.root!.color = Color.BLACK; // ルートは常に黒
  }

  // ====== 削除操作 ======

  delete(value: number): boolean {
    const node = this.findNode(value);
    if (!node) return false;

    let nodeToFix: Node | null;
    let nodeToFixParent: Node | null;

    // ケース1: 子が2つある場合、後継者で置き換え
    if (node.left && node.right) {
      const successor = this.findMin(node.right);
      node.value = successor.value;
      nodeToFix = this.deleteNode(successor);
      nodeToFixParent = successor.parent;
    } else {
      // ケース2: 子が0個か1個
      nodeToFix = this.deleteNode(node);
      nodeToFixParent = node.parent;
    }

    // 削除後の平衡を修正
    if (nodeToFix === null && nodeToFixParent) {
      this.fixDelete(nodeToFixParent, nodeToFix);
    } else if (nodeToFix) {
      this.fixDelete(nodeToFix, nodeToFix);
    }

    return true;
  }

  private findNode(value: number): Node | null {
    let current = this.root;
    while (current) {
      if (value === current.value) return current;
      if (value < current.value) current = current.left;
      else current = current.right;
    }
    return null;
  }

  private findMin(node: Node): Node {
    while (node.left) node = node.left;
    return node;
  }

  private deleteNode(node: Node): Node | null {
    const child = node.left || node.right;

    if (!node.parent) {
      // ルートを削除
      this.root = child;
      if (child) child.parent = null;
      return child;
    }

    // 親との関係を切り替え
    if (node === node.parent.left) {
      node.parent.left = child;
    } else {
      node.parent.right = child;
    }

    if (child) {
      child.parent = node.parent;
    }

    return child;
  }

  private fixDelete(node: Node, deletedNodeChild: Node | null): void {
    let current = node;

    while (current) {
      if (current === this.root) break;

      const parent = current.parent!;
      const isLeftChild = current === parent.left;
      const sibling = isLeftChild ? parent.right : parent.left;

      if (!sibling) {
        current = parent;
        continue;
      }

      // ケース1: 兄弟が赤い
      if (sibling.color === Color.RED) {
        sibling.color = Color.BLACK;
        parent.color = Color.RED;
        if (isLeftChild) {
          this.rotateLeft(parent);
        } else {
          this.rotateRight(parent);
        }
        current = node;
        continue;
      }

      const siblingLeft = sibling.left;
      const siblingRight = sibling.right;
      const siblingLeftColor = siblingLeft?.color || Color.BLACK;
      const siblingRightColor = siblingRight?.color || Color.BLACK;

      // ケース2: 兄弟と兄弟の子がすべて黒い
      if (
        sibling.color === Color.BLACK &&
        siblingLeftColor === Color.BLACK &&
        siblingRightColor === Color.BLACK
      ) {
        sibling.color = Color.RED;
        current = parent;
        continue;
      }

      // ケース3: 兄弟は黒だが、その子に赤がある
      if (sibling.color === Color.BLACK) {
        if (isLeftChild) {
          // 右の兄弟の場合
          if (
            siblingLeftColor === Color.RED &&
            siblingRightColor === Color.BLACK
          ) {
            // ケース3a: 兄弟の左の子が赤い
            siblingLeft!.color = Color.BLACK;
            sibling.color = Color.RED;
            this.rotateRight(sibling);
          } else if (siblingRightColor === Color.RED) {
            // ケース3b: 兄弟の右の子が赤い
            sibling.color = parent.color;
            parent.color = Color.BLACK;
            siblingRight!.color = Color.BLACK;
            this.rotateLeft(parent);
            break;
          }
        } else {
          // 左の兄弟の場合
          if (
            siblingRightColor === Color.RED &&
            siblingLeftColor === Color.BLACK
          ) {
            // ケース3a: 兄弟の右の子が赤い
            siblingRight!.color = Color.BLACK;
            sibling.color = Color.RED;
            this.rotateLeft(sibling);
          } else if (siblingLeftColor === Color.RED) {
            // ケース3b: 兄弟の左の子が赤い
            sibling.color = parent.color;
            parent.color = Color.BLACK;
            siblingLeft!.color = Color.BLACK;
            this.rotateRight(parent);
            break;
          }
        }
      }
    }

    if (this.root) {
      this.root.color = Color.BLACK;
    }
  }

  // ====== 回転操作 ======

  private rotateLeft(node: Node): void {
    const right = node.right!;
    node.right = right.left;

    if (right.left) {
      right.left.parent = node;
    }

    right.parent = node.parent;
    if (!node.parent) {
      this.root = right;
    } else if (node === node.parent.left) {
      node.parent.left = right;
    } else {
      node.parent.right = right;
    }

    right.left = node;
    node.parent = right;
  }

  private rotateRight(node: Node): void {
    const left = node.left!;
    node.left = left.right;

    if (left.right) {
      left.right.parent = node;
    }

    left.parent = node.parent;
    if (!node.parent) {
      this.root = left;
    } else if (node === node.parent.right) {
      node.parent.right = left;
    } else {
      node.parent.left = left;
    }

    left.right = node;
    node.parent = left;
  }

  // ====== 確認用メソッド ======

  printTree(node: Node | null = this.root, indent: string = ""): void {
    if (!node) return;

    console.log(indent + `${node.value}(${node.color})`);
    if (node.left || node.right) {
      if (node.left) {
        this.printTree(node.left, indent + "  L: ");
      } else {
        console.log(indent + "  L: null");
      }

      if (node.right) {
        this.printTree(node.right, indent + "  R: ");
      } else {
        console.log(indent + "  R: null");
      }
    }
  }
}

// ====== 使用例 ======

const tree = new RedBlackTree();
const values = [10, 5, 15, 3, 7, 12, 17, 1, 4, 6, 8];

console.log("順番に挿入: " + values.join(", ") + "\n");

for (const value of values) {
  tree.insert(value);
}

console.log("=== 挿入後の二色木 ===");
tree.printTree();

console.log("\n=== 削除テスト ===");
const toDelete = [3, 1, 5];
console.log("削除する値: " + toDelete.join(", ") + "\n");

for (const value of toDelete) {
  tree.delete(value);
  console.log(`${value} を削除後:`);
  tree.printTree();
  console.log();
}

console.log("\n=== 二色木のルール ===");
console.log("1. ノードは赤(RED)か黒(BLACK)");
console.log("2. ルートは黒");
console.log("3. 赤いノードの子は必ず黒（赤が連続しない）");
console.log("4. ルートから葉までの黒いノード数は同じ");
