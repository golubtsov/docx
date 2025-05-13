import * as Y from 'yjs';
import {Injectable} from "@nestjs/common";
import {DocumentNode} from "@docxservice/external/documentnode";

@Injectable()
export class YsyncAdapterService {
    private yRoot: Y.Map<any>;

    private ydoc: Y.Doc;

    private model: DocumentNode;

    private currentNodeId: number = 0;

    serYDoc(ydoc: Y.Doc) {
        this.ydoc = ydoc;
        return this;
    }

    setDocument(documentNode: DocumentNode) {
        this.model = documentNode;
        return this;
    }

    init() {
        this.yRoot = this.ydoc.getMap('root');
        this.initFromYjs();
        this.listenToYjs();
    }

    private initFromYjs() {
        if (this.yRoot.size > 0) {
            // если загружаемся от Yjs
        } else {
            // если загружаемся от объектной модели
            this.nodeToY(this.model, this.yRoot);
        }
    }

    private listenToYjs() {
        this.yRoot.observeDeep(events => {
            for (const event of events) {

                const target = event.target as Y.Map<any>;

                event.changes.keys.forEach((change, key) => {
                    const newVal = target.get(key);

                    const node = this.model.getElementById(target.get('id'));
                    node && node.setAttribute(key, newVal);
                });
            }
        });
    }

    private nodeToY(node: DocumentNode, yMap: Y.Map<any>) {
        this.currentNodeId += 1;
        node.id = String(this.currentNodeId);
        yMap.set('name', node.name);

        const yProps = new Y.Map();

        yProps.set('id', node.id);
        for (const [key, value] of Object.entries(node.getAttributes())) {
            yProps.set(key, value);
        }
        yMap.set('attributes', yProps);

        node.on('nodeChangedPublic', (data) => {
            yProps.set(data.key, data.value);
        });

        const yChildren = new Y.Array<Y.Map<any>>();
        for (const child of node.childNodes) {
            const yChild = new Y.Map();
            this.nodeToY(child, yChild);
            yChildren.push([yChild]);
        }

        yMap.set('children', yChildren);
    }
}