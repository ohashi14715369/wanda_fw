export const ComponentTypeList = ['card', 'token'] as const;
export type ComponentType = typeof ComponentTypeList[number];
export interface Component {
  id: string;
  type: ComponentType;
  value: any;
}
