// 二色木（Red-Black Tree）の解説コード
var Color;
(function (Color) {
    Color["RED"] = "RED";
    Color["BLACK"] = "BLACK";
})(Color || (Color = {}));
var Node = /** @class */ (function () {
    function Node(value) {
        this.color = Color.RED; // 新しいノードは赤
        this.left = null;
        this.right = null;
        this.parent = null;
        this.value = value;
    }
    return Node;
}());
var RedBlackTree = /** @class */ (function () {
    function RedBlackTree() {
        this.root = null;
    }
    // ====== 基本操作 ======
    RedBlackTree.prototype.insert = function (value) {
        if (this.root === null) {
            this.root = new Node(value);
            this.root.color = Color.BLACK; // ルートは常に黒
            return;
        }
        // 通常のBST挿入
        var current = this.root;
        var parent = null;
        while (current) {
            parent = current;
            if (value < current.value) {
                current = current.left;
            }
            else {
                current = current.right;
            }
        }
        var newNode = new Node(value);
        newNode.parent = parent;
        if (value < parent.value) {
            parent.left = newNode;
        }
        else {
            parent.right = newNode;
        }
        // 平衡を修正
        this.fixInsert(newNode);
    };
    // ====== 二色木のルール ======
    // 1. ノードは赤か黒
    // 2. ルートは黒
    // 3. 葉（null）は黒と見なす
    // 4. 赤いノードの子は黒（赤が連続しない）
    // 5. ルートから葉までの黒いノード数は同じ
    RedBlackTree.prototype.fixInsert = function (node) {
        var _a, _b, _c;
        while (node.parent && node.parent.color === Color.RED) {
            if (node.parent === ((_a = node.parent.parent) === null || _a === void 0 ? void 0 : _a.left)) {
                var uncle = (_b = node.parent.parent) === null || _b === void 0 ? void 0 : _b.right;
                // ケース1: 叔父が赤い → 色を変える
                if (uncle && uncle.color === Color.RED) {
                    node.parent.color = Color.BLACK;
                    uncle.color = Color.BLACK;
                    node.parent.parent.color = Color.RED;
                    node = node.parent.parent;
                }
                else {
                    // ケース2・3: 叔父が黒い → 回転が必要
                    // ケース2: 三角形の形 → 回転で一直線に
                    if (node === node.parent.right) {
                        node = node.parent;
                        this.rotateLeft(node);
                    }
                    // ケース3: 一直線の形 → 回転と色変更
                    node.parent.color = Color.BLACK;
                    node.parent.parent.color = Color.RED;
                    this.rotateRight(node.parent.parent);
                }
            }
            else {
                // 左右対称のケース
                var uncle = (_c = node.parent.parent) === null || _c === void 0 ? void 0 : _c.left;
                if (uncle && uncle.color === Color.RED) {
                    node.parent.color = Color.BLACK;
                    uncle.color = Color.BLACK;
                    node.parent.parent.color = Color.RED;
                    node = node.parent.parent;
                }
                else {
                    if (node === node.parent.left) {
                        node = node.parent;
                        this.rotateRight(node);
                    }
                    node.parent.color = Color.BLACK;
                    node.parent.parent.color = Color.RED;
                    this.rotateLeft(node.parent.parent);
                }
            }
        }
        this.root.color = Color.BLACK; // ルートは常に黒
    };
    // ====== 削除操作 ======
    RedBlackTree.prototype.delete = function (value) {
        var node = this.findNode(value);
        if (!node)
            return false;
        var nodeToFix;
        var nodeToFixParent;
        // ケース1: 子が2つある場合、後継者で置き換え
        if (node.left && node.right) {
            var successor = this.findMin(node.right);
            node.value = successor.value;
            nodeToFix = this.deleteNode(successor);
            nodeToFixParent = successor.parent;
        }
        else {
            // ケース2: 子が0個か1個
            nodeToFix = this.deleteNode(node);
            nodeToFixParent = node.parent;
        }
        // 削除後の平衡を修正
        if (nodeToFix === null && nodeToFixParent) {
            this.fixDelete(nodeToFixParent, nodeToFix);
        }
        else if (nodeToFix) {
            this.fixDelete(nodeToFix, nodeToFix);
        }
        return true;
    };
    RedBlackTree.prototype.findNode = function (value) {
        var current = this.root;
        while (current) {
            if (value === current.value)
                return current;
            if (value < current.value)
                current = current.left;
            else
                current = current.right;
        }
        return null;
    };
    RedBlackTree.prototype.findMin = function (node) {
        while (node.left)
            node = node.left;
        return node;
    };
    RedBlackTree.prototype.deleteNode = function (node) {
        var child = node.left || node.right;
        if (!node.parent) {
            // ルートを削除
            this.root = child;
            if (child)
                child.parent = null;
            return child;
        }
        // 親との関係を切り替え
        if (node === node.parent.left) {
            node.parent.left = child;
        }
        else {
            node.parent.right = child;
        }
        if (child) {
            child.parent = node.parent;
        }
        return child;
    };
    RedBlackTree.prototype.fixDelete = function (node, deletedNodeChild) {
        var current = node;
        while (current) {
            if (current === this.root)
                break;
            var parent_1 = current.parent;
            var isLeftChild = current === parent_1.left;
            var sibling = isLeftChild ? parent_1.right : parent_1.left;
            if (!sibling) {
                current = parent_1;
                continue;
            }
            // ケース1: 兄弟が赤い
            if (sibling.color === Color.RED) {
                sibling.color = Color.BLACK;
                parent_1.color = Color.RED;
                if (isLeftChild) {
                    this.rotateLeft(parent_1);
                }
                else {
                    this.rotateRight(parent_1);
                }
                current = node;
                continue;
            }
            var siblingLeft = sibling.left;
            var siblingRight = sibling.right;
            var siblingLeftColor = (siblingLeft === null || siblingLeft === void 0 ? void 0 : siblingLeft.color) || Color.BLACK;
            var siblingRightColor = (siblingRight === null || siblingRight === void 0 ? void 0 : siblingRight.color) || Color.BLACK;
            // ケース2: 兄弟と兄弟の子がすべて黒い
            if (sibling.color === Color.BLACK &&
                siblingLeftColor === Color.BLACK &&
                siblingRightColor === Color.BLACK) {
                sibling.color = Color.RED;
                current = parent_1;
                continue;
            }
            // ケース3: 兄弟は黒だが、その子に赤がある
            if (sibling.color === Color.BLACK) {
                if (isLeftChild) {
                    // 右の兄弟の場合
                    if (siblingLeftColor === Color.RED &&
                        siblingRightColor === Color.BLACK) {
                        // ケース3a: 兄弟の左の子が赤い
                        siblingLeft.color = Color.BLACK;
                        sibling.color = Color.RED;
                        this.rotateRight(sibling);
                    }
                    else if (siblingRightColor === Color.RED) {
                        // ケース3b: 兄弟の右の子が赤い
                        sibling.color = parent_1.color;
                        parent_1.color = Color.BLACK;
                        siblingRight.color = Color.BLACK;
                        this.rotateLeft(parent_1);
                        break;
                    }
                }
                else {
                    // 左の兄弟の場合
                    if (siblingRightColor === Color.RED &&
                        siblingLeftColor === Color.BLACK) {
                        // ケース3a: 兄弟の右の子が赤い
                        siblingRight.color = Color.BLACK;
                        sibling.color = Color.RED;
                        this.rotateLeft(sibling);
                    }
                    else if (siblingLeftColor === Color.RED) {
                        // ケース3b: 兄弟の左の子が赤い
                        sibling.color = parent_1.color;
                        parent_1.color = Color.BLACK;
                        siblingLeft.color = Color.BLACK;
                        this.rotateRight(parent_1);
                        break;
                    }
                }
            }
        }
        if (this.root) {
            this.root.color = Color.BLACK;
        }
    };
    // ====== 回転操作 ======
    RedBlackTree.prototype.rotateLeft = function (node) {
        var right = node.right;
        node.right = right.left;
        if (right.left) {
            right.left.parent = node;
        }
        right.parent = node.parent;
        if (!node.parent) {
            this.root = right;
        }
        else if (node === node.parent.left) {
            node.parent.left = right;
        }
        else {
            node.parent.right = right;
        }
        right.left = node;
        node.parent = right;
    };
    RedBlackTree.prototype.rotateRight = function (node) {
        var left = node.left;
        node.left = left.right;
        if (left.right) {
            left.right.parent = node;
        }
        left.parent = node.parent;
        if (!node.parent) {
            this.root = left;
        }
        else if (node === node.parent.right) {
            node.parent.right = left;
        }
        else {
            node.parent.left = left;
        }
        left.right = node;
        node.parent = left;
    };
    // ====== 確認用メソッド ======
    RedBlackTree.prototype.printTree = function (node, indent) {
        if (node === void 0) { node = this.root; }
        if (indent === void 0) { indent = ""; }
        if (!node)
            return;
        console.log(indent + "".concat(node.value, "(").concat(node.color, ")"));
        if (node.left || node.right) {
            if (node.left) {
                this.printTree(node.left, indent + "  L: ");
            }
            else {
                console.log(indent + "  L: null");
            }
            if (node.right) {
                this.printTree(node.right, indent + "  R: ");
            }
            else {
                console.log(indent + "  R: null");
            }
        }
    };
    return RedBlackTree;
}());
// ====== 使用例 ======
var tree = new RedBlackTree();
var values = [10, 5, 15, 3, 7, 12, 17, 1, 4, 6, 8];
console.log("順番に挿入: " + values.join(", ") + "\n");
for (var _i = 0, values_1 = values; _i < values_1.length; _i++) {
    var value = values_1[_i];
    tree.insert(value);
}
console.log("=== 挿入後の二色木 ===");
tree.printTree();
console.log("\n=== 削除テスト ===");
var toDelete = [3, 1, 5];
console.log("削除する値: " + toDelete.join(", ") + "\n");
for (var _a = 0, toDelete_1 = toDelete; _a < toDelete_1.length; _a++) {
    var value = toDelete_1[_a];
    tree.delete(value);
    console.log("".concat(value, " \u3092\u524A\u9664\u5F8C:"));
    tree.printTree();
    console.log();
}
console.log("\n=== 二色木のルール ===");
console.log("1. ノードは赤(RED)か黒(BLACK)");
console.log("2. ルートは黒");
console.log("3. 赤いノードの子は必ず黒（赤が連続しない）");
console.log("4. ルートから葉までの黒いノード数は同じ");
