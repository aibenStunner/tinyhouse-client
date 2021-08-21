import React, { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { Layout, List, Typography, Affix } from "antd";
import { ListingCard, ErrorBanner } from "../../lib/components";
import { LISTINGS } from "../../lib/graphql/queries";
import {
  Listings as ListingData,
  ListingsVariables,
} from "../../lib/graphql/queries/Listings/__generated__/Listings";
import {
  ListingsFilters,
  ListingsPagination,
  ListingsSkeleton,
} from "./components";
import { useScrollToTop } from "../../lib/hooks/useScrollToTop";
import { ListingsFilter } from "../../lib/graphql/globalTypes";

interface MatchParams {
  location: string;
}

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const PAGE_LIMIT = 8;

export const Listings = () => {
  const { location } = useParams<MatchParams>();

  const locationRef = useRef(location);
  const [filter, setFilter] = useState(ListingsFilter.PRICE_LOW_TO_HIGH);
  const [page, setPage] = useState(1);

  const { data, loading, error } = useQuery<ListingData, ListingsVariables>(
    LISTINGS,
    {
      skip: locationRef.current !== location && page !== 1,
      variables: {
        location,
        filter,
        limit: PAGE_LIMIT,
        page,
      },
    }
  );

  useEffect(() => {
    setPage(1);
    locationRef.current = location;
  }, [location]);

  useScrollToTop();

  if (loading) {
    return (
      <Content className="listings">
        <ListingsSkeleton />
      </Content>
    );
  }

  if (error) {
    return (
      <Content className="listings">
        <ErrorBanner description="we either couldn't find anything matching your search or have encounterd an error. If you're searching for a unique location, try searching again with a more common keyword." />
        <ListingsSkeleton />
      </Content>
    );
  }

  const listings = data ? data.listings : null;
  const listingsRegion = listings ? listings.region : null;

  const listingsSectionElement =
    listings && listings.result.length ? (
      <div>
        <Affix offsetTop={64}>
          <ListingsPagination
            total={listings.total}
            page={page}
            limit={PAGE_LIMIT}
            setPage={setPage}
          />
          <ListingsFilters filter={filter} setFilter={setFilter} />
        </Affix>

        <List
          grid={{
            gutter: 8,
            xs: 1,
            sm: 2,
            lg: 4,
          }}
          dataSource={listings.result}
          renderItem={(listing) => (
            <List.Item>
              <ListingCard listing={listing} />
            </List.Item>
          )}
        />
      </div>
    ) : (
      <div>
        <Paragraph>
          It appears that no listings have yet been created for{" "}
          <Text mark>"{listingsRegion}"</Text>
        </Paragraph>
        <Paragraph>
          Be the first person to create a{" "}
          <Link to="/host">listing in this area</Link>!
        </Paragraph>
      </div>
    );

  const listingRegionElement = listingsRegion ? (
    <Title level={3} className="listings__title">
      Results for "{listingsRegion}"
    </Title>
  ) : null;

  return (
    <Content className="listings">
      {listingRegionElement}
      {listingsSectionElement}
    </Content>
  );
};
