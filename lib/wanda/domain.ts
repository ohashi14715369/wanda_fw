import { Component } from './component';

export interface Domain {
  id: string;
  code?: string;
  owner?: string[];
  components?: Component[];
  children?: Domain[];
}
export interface DomainData {
  id: string;
  code?: string;
  owner?: string[];
  children?: DomainData[];
  components?: Component[];
  componentsCount?: number;
}
export interface DomainQuery {
  domainId?: string;
}

export function convertDomainToPublicData(
  domain: Domain,
  owner?: string,
): DomainData {
  const visible =
    domain.owner === undefined || (owner && domain.owner.includes(owner));
  return {
    id: domain.id,
    code: domain.code,
    owner: domain.owner,
    componentsCount: domain.components?.length,
    children: domain.children?.map(child =>
      convertDomainToPublicData(child, owner),
    ),
    components: visible ? domain.components : undefined,
  };
}
export function searchDomain(
  domain: Domain,
  query: DomainQuery,
): Domain | undefined {
  if (domain.id === query.domainId) {
    return domain;
  }
  return domain.children?.find(child => searchDomain(child, query));
}

export function searchDomainData(
  domain: DomainData,
  query: DomainQuery,
): DomainData | undefined {
  if (domain.id === query.domainId) {
    return domain;
  }
  return domain.children?.find(child => searchDomainData(child, query));
}
