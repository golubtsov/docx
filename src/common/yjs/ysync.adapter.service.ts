import * as Y from 'yjs';
import { Injectable } from '@nestjs/common';
import { DocumentNode } from '@docxservice/external/documentnode';

@Injectable()
export class YsyncAdapterService {
    private yRoot: Y.Map<any>;
    private ydoc: Y.Doc;
    private model: DocumentNode;

    init(ydoc: Y.Doc, documentNode: DocumentNode) {
        this.ydoc = ydoc;
        this.model = documentNode;
        this.yRoot = ydoc.getMap('root');

        this.yRoot.size > 0 ? this.loadFromYjs() : this.syncModelToYjs();
        this.setupYjsListener();
    }

    private loadFromYjs() {
        // TODO: Реализовать загрузку из Yjs при необходимости
    }

    private syncModelToYjs() {
        this.syncNodeToY(this.model, this.yRoot);
    }

    private syncNodeToY(node: DocumentNode, yMap: Y.Map<any>) {
        const yProps = new Y.Map();
        yProps.set('id', node.id);

        // Синхронизация атрибутов
        Object.entries(node.getAttributes()).forEach(([key, value]) => {
            yProps.set(key, value);
        });

        // Синхронизация дочерних элементов
        const yChildren = new Y.Array();
        node.childNodes.forEach((child) => {
            const yChild = new Y.Map();
            this.syncNodeToY(child, yChild);
            yChildren.push([yChild]);
        });

        // Настройка слушателя изменений
        node.on('nodeChangedPublic', ({ key, value }) => {
            yProps.set(key, value);
        });

        // Сохранение в Yjs
        yMap.set('attributes', yProps);
        yMap.set('children', yChildren);
    }

    private setupYjsListener() {
        this.yRoot.observeDeep((events) => {
            events.forEach((event) => {
                const target = event.target as Y.Map<any>;
                event.changes.keys.forEach((change, key) => {
                    const node = this.model.getElementById(target.get('id'));
                    node?.setAttribute(key, target.get(key));
                });
            });
        });
    }
}
