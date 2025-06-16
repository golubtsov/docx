import * as Y from 'yjs';
import { Injectable } from '@nestjs/common';
import { ComponentInterface, Text } from '@docxservice/internal/container';
import { InternalComponentFactory } from '@docxservice/internal/componentfactory';
import { PartInterface } from '@docxservice/internal/parts/partinterface';

@Injectable()
export class YsyncAdapterService {
    nodeToY(node: ComponentInterface, yMap: Y.Map<any>) {  
        const yProps = new Y.Map();
        const yId = this.randId();
    
        yMap.set('yId', yId);
        yMap.set('attributes', yProps);
        yMap.set('type', node.constructor.name);
        yMap.set('code', node.getCode());
        
        if (typeof (node as PartInterface).getUri === 'function') {
            yMap.set('uri', (node as PartInterface).getUri());
        }

        if (typeof (node as Text).getText === 'function') {
            yMap.set('text', (node as Text).getText());
        }
        
        for (const [key, value] of Object.entries(node.getAttributes())) {
            yProps.set(key as string, value as string);
        }
    
        const yChildren = new Y.Array<Y.Map<any>>();
        if (node.isComposite()) {
          for (const child of node.getChildren()) {
            const yChild = new Y.Map();

            this.nodeToY(child, yChild);

            yChildren.push([yChild]);
          }
        }
    
        yMap.set('children', yChildren);
    }

    yToNode (yMap: Y.Map<any>): ComponentInterface {
        const node: ComponentInterface = InternalComponentFactory.create(yMap.get('type'), {});
    
        (yMap.get('children') as Y.Array<Y.Map<any>>).forEach(child => node.appendChild(this.yToNode(child)));
    
        (yMap.get('attributes')).forEach((value: string, key: string) => {
            node.setAttribute(key, value);
        });
    
        node.yId = yMap.get('yId');
        node.setCode(yMap.get('code'));
    
        if (yMap.get('uri')) {
            (node as PartInterface).setUri(yMap.get('uri'));
        }
        if (yMap.get('text')) {
            (node as Text).setText(yMap.get('text'));
        }    
    
        return node;
    }

    private randId(): string {
      return Math.random().toString(36).replace('0.', 'id_');
    }
}
