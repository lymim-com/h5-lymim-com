const { createApp, ref, computed } = Vue;

Vue.createApp({
  data() {
    return {
      stickies: [],
      editingSticky: null,
      editingContent: '',
      isAdding: false,
    }
  },
  watch: {
    // 当编辑中的便笺发生变化时，进行相应的操作
    editingSticky(newEditing) {
      // 标记是否正在编辑新对象
      this.isAdding = newEditing != null && newEditing.uid == null;

      if (newEditing == null) {
        // 编辑对象为 null，表示结束编辑，清空缓存
        this.editingContent = '';
      } else {
        // 编辑对象为指定对象，表示开始编辑，将目标的内容加入缓存
        this.editingContent = newEditing.content;
      }
    }
  },
  directives: {
    focus: {
      mounted: function (el) {
        el.focus()
      }
    }
  },
  methods: {
    getStickies() {
      fetch(`https://h5api.lymim.com/sticky`)
        .then(res => res.json())
        .then(objs => {
          objs.forEach(obj => {
            var sticky = {
              uid: obj.uid,
              content: obj.content,
              color: 'LightGoldenRodYellow',
              create_time: obj.create_time,
            };
            this.stickies.push(sticky);
          });
        });
    },

    editSticky(sticky) {
      this.editingSticky = sticky;
    },

    confirmEdit() {
      this.editingSticky.content = this.editingContent;

      if (this.editingSticky.uid != null) {
        // 完成编辑
        console.log(`提交便笺修改 ${JSON.stringify(this.editingSticky)}`);
        fetch(`https://h5api.lymim.com/sticky?uid=${this.editingSticky.uid}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.editingSticky),
        });
      } else {
        // 完成新增
        console.log(`提交新便笺 ${JSON.stringify(this.editingSticky)}`);
        const pendingSticky = this.editingSticky;
        fetch(`https://h5api.lymim.com/sticky`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.editingSticky),
        }).then(response => {
          return response.json();
        }).then(postResult => {
          pendingSticky.uid = postResult.uid;
          pendingSticky.color = postResult.color;
          pendingSticky.create_time = postResult.create_time;
        });
      }

      this.editingSticky = null;
    },

    cancleEdit() {
      if (this.editingSticky.uid == null) {
        // 编辑中的便笺为新便笺时，取消编辑时还需要移出列表
        var index = this.stickies.indexOf(this.editingSticky);
        this.stickies.splice(index, 1);
      }
      this.editingSticky = null;
    },

    addSticky() {
      if (this.editingSticky != null) {
        this.cancleEdit();
      }

      var newSticky = {
      };

      this.stickies.push(newSticky);
      this.editingSticky = newSticky;
    },

    removeSticky(sticky) {
      var r = confirm('确认删除便笺?');
      if (r == false) return;

      var index = this.stickies.indexOf(sticky);
      this.stickies.splice(index, 1);

      fetch(`https://h5api.lymim.com/sticky?uid=${sticky.uid}`, {
        method: 'DELETE',
      });
    },

    move(sticky, offset) {
      var index = this.stickies.indexOf(sticky);
      var newIndex = index + offset;
      if (newIndex < 0 || newIndex >= this.stickies.length) {
        return;
      }

      const ele = this.stickies.splice(index, 1);
      this.stickies.splice(newIndex, 0, ele[0]);
    },

    compiledMarkdown(sticky) {
      return marked.parse(sticky.content ?? '');
    }
  },
  mounted() {
    this.getStickies();

    hotkeys('ctrl+enter, esc', (_ev, h) => {
      switch (h.key) {
        case 'ctrl+enter':
          this.confirmEdit();
          break;
        case 'esc':
          this.cancleEdit();
          break;
      }
    });
    // hotkeys 默认会被 textarea 等元素阻止，设置 filter 以允许所有热键
    hotkeys.filter = () => true;
  }
}).mount('#sticky-board');