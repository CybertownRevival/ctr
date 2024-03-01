export interface WorldBrowserData {
    loaded: boolean;
    worldsData: any;
    avatarsData: any;
    browser: any;
    uniqValue: number;
    place?: {
        name: string;
        assets_dir: string;
        id: string;
        world_filename: string;
        slug: string;
    };
    position: [number, number, number];
    rotation: [number, number, number, number];
    users: any;
    ROTATE180: any;
    TYPES: any;
    sharedEvent: any;
    eventNodeMap: any;
    sharedObjects: any[];
    sharedObjectsMap: Map<any, any>;
    showUpdateWarning: boolean;
    mainComponent: any;
    force2d: boolean;
    rotation_offset: number;
    objectSelected: boolean;
}
